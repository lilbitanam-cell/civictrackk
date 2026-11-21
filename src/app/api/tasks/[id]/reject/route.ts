import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getTaskById } from "@/services/tasks.service";
import { logComplaintHistory } from "@/services/history.service";
import { sendNotification } from "@/services/notifications.service";
import { getClientDb } from "@/lib/firebase/config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

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
    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = body as { reason: string };

    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const db = getClientDb();

    // 1. Reopen task (back to pending)
    const taskRef = doc(db, "workerTasks", taskId);
    await updateDoc(taskRef, {
      status: "pending",
      rejectionReason: reason,
      updatedAt: serverTimestamp(),
    });

    // 2. Revert complaint status to in_progress
    const complaintRef = doc(db, "complaints", task.complaintId);
    await updateDoc(complaintRef, {
      status: "in_progress",
      updatedAt: serverTimestamp(),
    });

    // 3. Log history
    await logComplaintHistory({
      complaintId: task.complaintId,
      actorId: session.uid,
      actorName: session.displayName || "Admin",
      actorRole: "admin",
      action: "reopened",
      previousStatus: "resolved",
      newStatus: "in_progress",
      notes: `Admin rejected resolution. Reason: ${reason}`,
    });

    // 4. Notify worker
    await sendNotification({
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
