import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getTaskByIdServer } from "@/services/server/tasks.server";
import { logComplaintHistoryServer } from "@/services/server/history.server";
import { sendNotificationServer } from "@/services/server/notifications.server";
import { getAdminDb } from "@/lib/firebase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── POST /api/tasks/[id]/reject ────────────────────────────────────────────
// Admin rejects a submitted resolution; reopens the task.
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: taskId } = await context.params;

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
    }

    let body: { reason?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const task = await getTaskByIdServer(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const db = getAdminDb();
    const now = new Date();

    // 1. Reopen task (back to pending)
    await db.collection("workerTasks").doc(taskId).update({
      status: "pending",
      rejectionReason: reason,
      updatedAt: now,
    });

    // 2. Revert complaint status to in_progress
    await db.collection("complaints").doc(task.complaintId).update({
      status: "in_progress",
      updatedAt: now,
    });

    // 3. Log history
    await logComplaintHistoryServer({
      complaintId: task.complaintId,
      actorId: session.uid,
      actorName: session.displayName || "Admin",
      actorRole: "admin",
      action: "reopened",
      previousStatus: "resolution_submitted",
      newStatus: "in_progress",
      notes: `Admin rejected resolution. Reason: ${reason}`,
    });

    // 4. Notify worker
    await sendNotificationServer({
      userId: task.workerId,
      title: "Resolution Rejected",
      message: `Your submitted resolution for "${task.complaintTitle}" was rejected. Reason: ${reason}`,
      type: "complaint_status_change",
      relatedComplaintId: task.complaintId,
      relatedTaskId: taskId,
      actionUrl: `/worker/tasks/${taskId}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("POST /api/tasks/[id]/reject error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
