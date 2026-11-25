import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getComplaintDocumentByIdServer } from "@/services/server/complaints.server";
import { logComplaintHistoryServer } from "@/services/server/history.server";
import { sendNotificationServer } from "@/services/server/notifications.server";
import { getAdminDb } from "@/lib/firebase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── POST /api/complaints/[id]/assign ──────────────────────────────────────
// Admin assigns a worker to a complaint.
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: complaintId } = await context.params;

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await verifySessionToken(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const departmentId = typeof body.departmentId === "string" ? body.departmentId.trim() : "";
    const departmentName = typeof body.departmentName === "string" ? body.departmentName.trim() : departmentId;
    const workerId = typeof body.workerId === "string" ? body.workerId.trim() : "";
    const workerName = typeof body.workerName === "string" ? body.workerName.trim() : "";
    const priority = typeof body.priority === "string" ? body.priority.trim() : "";
    const instructions = typeof body.instructions === "string" ? body.instructions.trim() : "";

    if (!departmentId || !workerId || !workerName) {
      return NextResponse.json(
        { error: "Missing required fields: departmentId, workerId, workerName" },
        { status: 400 }
      );
    }

    const complaint = await getComplaintDocumentByIdServer(complaintId);
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }
    if (["resolved", "closed", "rejected"].includes(complaint.status)) {
      return NextResponse.json(
        { error: `Cannot assign worker when complaint is in "${complaint.status}" status.` },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const now = new Date();

    // 1. Update complaint
    await db.collection("complaints").doc(complaintId).update({
      status: "assigned",
      departmentId,
      departmentName,
      assignedWorkerId: workerId,
      assignedWorkerName: workerName,
      assignedAt: now,
      updatedAt: now,
    });

    // 2. Create workerTasks doc
    const taskDoc = await db.collection("workerTasks").add({
      complaintId,
      complaintTicketNumber: complaint.ticketNumber,
      complaintTitle: complaint.title,
      complaintCategory: complaint.category,
      workerId,
      workerName,
      departmentId,
      status: "pending",
      priority: priority || complaint.priority,
      location: complaint.location,
      instructions: instructions || "",
      assignedByUserId: session.uid,
      assignedByUserName: session.displayName || "Admin",
      evidenceImages: [],
      createdAt: now,
      updatedAt: now,
    });

    const taskId = taskDoc.id;

    // 3. Log complaint history
    await logComplaintHistoryServer({
      complaintId,
      actorId: session.uid,
      actorName: session.displayName || "Admin",
      actorRole: "admin",
      action: "worker_assigned",
      previousStatus: complaint.status,
      newStatus: "assigned",
      notes: `Assigned to field worker ${workerName} (${departmentName}).`,
    });

    // 4. Notify worker
    await sendNotificationServer({
      userId: workerId,
      title: "New Task Assigned",
      message: `You have been assigned a new task: "${complaint.title}".`,
      type: "task_assigned",
      relatedComplaintId: complaintId,
      relatedTaskId: taskId,
      actionUrl: `/worker/tasks/${taskId}`,
    });

    // 5. Notify citizen
    if (complaint.citizenId) {
      await sendNotificationServer({
        userId: complaint.citizenId,
        title: "Complaint Assigned",
        message: `Your complaint "${complaint.title}" has been assigned to a field worker.`,
        type: "complaint_assigned",
        relatedComplaintId: complaintId,
        actionUrl: `/citizen/complaints/${complaintId}`,
      });
    }

    return NextResponse.json({ success: true, taskId });
  } catch (err: unknown) {
    console.error("POST /api/complaints/[id]/assign error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
