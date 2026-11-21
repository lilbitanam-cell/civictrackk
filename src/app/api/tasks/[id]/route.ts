import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getTaskById } from "@/services/tasks.service";
import { getComplaintById } from "@/services/complaints.service";
import { logComplaintHistory } from "@/services/history.service";
import { sendNotification } from "@/services/notifications.service";
import { getClientDb } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { TaskStatus } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus> = {
  pending: "accepted",
  accepted: "in_progress",
  in_progress: "completed",
  completed: "completed", // terminal
  on_hold: "pending",
};

// ─── GET /api/tasks/[id] ────────────────────────────────────────────────────
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await getTaskById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Workers can only access their own tasks
    if (session.role === "worker" && task.workerId !== session.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Citizens cannot access tasks
    if (session.role === "citizen") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, task });
  } catch (err: unknown) {
    console.error("GET /api/tasks/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── PATCH /api/tasks/[id] ──────────────────────────────────────────────────
// Worker updates task status with optional notes and evidence images.
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    if (session.role !== "worker") {
      return NextResponse.json({ error: "Forbidden: worker only" }, { status: 403 });
    }

    const body = await request.json();
    const { status: newStatus, notes, evidenceImages } = body as {
      status: TaskStatus;
      notes?: string;
      evidenceImages?: string[];
    };

    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.workerId !== session.uid) {
      return NextResponse.json({ error: "Forbidden: not your task" }, { status: 403 });
    }

    // Validate transition
    const expectedNext = VALID_TRANSITIONS[task.status];
    if (!expectedNext || newStatus !== expectedNext) {
      return NextResponse.json(
        {
          error: `Invalid status transition: ${task.status} → ${newStatus}. Expected: ${expectedNext}`,
        },
        { status: 400 }
      );
    }

    const db = getClientDb();
    const taskRef = doc(db, "workerTasks", taskId);

    const taskUpdates: Record<string, unknown> = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };

    if (notes) taskUpdates.evidenceNotes = notes;

    if (newStatus === "in_progress") {
      taskUpdates.startedAt = serverTimestamp();

      // Update complaint status
      const complaintRef = doc(db, "complaints", task.complaintId);
      await updateDoc(complaintRef, {
        status: "in_progress",
        updatedAt: serverTimestamp(),
      });

      // Log history
      await logComplaintHistory({
        complaintId: task.complaintId,
        actorId: session.uid,
        actorName: session.displayName || task.workerName,
        actorRole: "worker",
        action: "status_changed",
        previousStatus: "assigned",
        newStatus: "in_progress",
        notes: notes || "Field worker started working on the complaint.",
      });

      // Notify citizen
      const complaint = await getComplaintById(task.complaintId);
      if (complaint?.citizenId) {
        await sendNotification({
          userId: complaint.citizenId,
          title: "Work In Progress",
          message: `A field worker has started working on your complaint "${task.complaintTitle}".`,
          type: "complaint_status_change",
          relatedComplaintId: task.complaintId,
          actionUrl: `/citizen/complaints/${task.complaintId}`,
        });
      }
    } else if (newStatus === "completed") {
      taskUpdates.completedAt = serverTimestamp();

      if (evidenceImages && evidenceImages.length > 0) {
        taskUpdates.evidenceImages = evidenceImages;
      }

      // Update complaint to resolution_submitted (NOT resolved — admin must approve)
      const complaintRef = doc(db, "complaints", task.complaintId);
      const complaintUpdates: Record<string, unknown> = {
        status: "resolution_submitted",
        updatedAt: serverTimestamp(),
      };
      if (notes) complaintUpdates.resolutionNotes = notes;
      if (evidenceImages && evidenceImages.length > 0) {
        complaintUpdates.resolutionImages = evidenceImages;
      }
      await updateDoc(complaintRef, complaintUpdates);

      // Log history
      await logComplaintHistory({
        complaintId: task.complaintId,
        actorId: session.uid,
        actorName: session.displayName || task.workerName,
        actorRole: "worker",
        action: "status_changed",
        previousStatus: "in_progress",
        newStatus: "resolution_submitted",
        notes: notes || "Worker submitted resolution for admin verification.",
      });

      // Notify all admins
      const usersRef = collection(db, "users");
      const adminQuery = query(usersRef, where("role", "==", "admin"));
      const adminSnap = await getDocs(adminQuery);
      const adminNotifPromises = adminSnap.docs.map((adminDoc) =>
        sendNotification({
          userId: adminDoc.id,
          title: "Resolution Submitted for Review",
          message: `Worker ${task.workerName} has submitted a resolution for complaint "${task.complaintTitle}". Please review and approve or reject.`,
          type: "complaint_status_change",
          relatedComplaintId: task.complaintId,
          relatedTaskId: taskId,
          actionUrl: `/admin/complaints/${task.complaintId}`,
        })
      );
      await Promise.all(adminNotifPromises);

      // Notify citizen
      const complaint = await getComplaintById(task.complaintId);
      if (complaint?.citizenId) {
        await sendNotification({
          userId: complaint.citizenId,
          title: "Resolution Submitted",
          message: `A resolution has been submitted for your complaint "${task.complaintTitle}". It is now awaiting admin verification.`,
          type: "complaint_status_change",
          relatedComplaintId: task.complaintId,
          actionUrl: `/citizen/complaints/${task.complaintId}`,
        });
      }
    } else if (newStatus === "accepted") {
      // No side-effects needed beyond status update
    }

    await updateDoc(taskRef, taskUpdates);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("PATCH /api/tasks/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
