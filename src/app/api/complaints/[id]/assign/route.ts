import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getComplaintById } from "@/services/complaints.service";
import { logComplaintHistory } from "@/services/history.service";
import { sendNotification } from "@/services/notifications.service";
import { getClientDb } from "@/lib/firebase/config";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

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
    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { departmentId, departmentName, workerId, workerName, priority, instructions } = body;

    if (!departmentId || !workerId || !workerName) {
      return NextResponse.json(
        { error: "Missing required fields: departmentId, workerId, workerName" },
        { status: 400 }
      );
    }

    const complaint = await getComplaintById(complaintId);
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const db = getClientDb();
    const now = serverTimestamp();

    // 1. Update complaint
    const complaintRef = doc(db, "complaints", complaintId);
    await updateDoc(complaintRef, {
      status: "assigned",
      departmentId,
      departmentName,
      assignedWorkerId: workerId,
      assignedWorkerName: workerName,
      assignedAt: now,
      updatedAt: now,
    });

    // 2. Create workerTasks doc
    const tasksRef = collection(db, "workerTasks");
    const taskDoc = await addDoc(tasksRef, {
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
    await logComplaintHistory({
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
    await sendNotification({
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
      await sendNotification({
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
