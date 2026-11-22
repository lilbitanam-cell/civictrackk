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

/**
 * POST /api/admin/complaints/[id]/resolve
 *
 * Admin approves or rejects a worker's submitted resolution.
 * Body: { action: "approve" | "reject", reason?: string }
 *
 * approve → complaint status = "resolved", resolvedAt = now
 * reject  → complaint status = "in_progress", worker task reverted to "in_progress"
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: complaintId } = await context.params;

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = verifySessionToken(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

    const { action, reason } = (await request.json()) as {
      action: "approve" | "reject";
      reason?: string;
    };

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    if (action === "reject" && !reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const complaint = await getComplaintDocumentByIdServer(complaintId);
    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }

    if (complaint.status !== "resolution_submitted") {
      return NextResponse.json(
        {
          error: `Complaint is not in resolution_submitted status. Current: ${complaint.status}`,
        },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const now = new Date();

    if (action === "approve") {
      // ── APPROVE: Set complaint to resolved ──
      await db.collection("complaints").doc(complaintId).update({
        status: "resolved",
        resolvedAt: now,
        updatedAt: now,
      });

      await logComplaintHistoryServer({
        complaintId,
        actorId: session.uid,
        actorName: session.displayName || "Admin",
        actorRole: "admin",
        action: "status_changed",
        previousStatus: "resolution_submitted",
        newStatus: "resolved",
        notes: "Admin approved the resolution. Complaint marked as resolved.",
      });

      // Notify citizen
      if (complaint.citizenId) {
        await sendNotificationServer({
          userId: complaint.citizenId,
          title: "Complaint Resolved",
          message: `Your complaint "${complaint.title}" has been resolved. Thank you for your report.`,
          type: "complaint_resolved",
          relatedComplaintId: complaintId,
          actionUrl: `/citizen/complaints/${complaintId}`,
        });
      }

      // Notify worker
      if (complaint.assignedWorkerId) {
        await sendNotificationServer({
          userId: complaint.assignedWorkerId,
          title: "Resolution Approved",
          message: `Your resolution for "${complaint.title}" has been approved by admin.`,
          type: "complaint_status_change",
          relatedComplaintId: complaintId,
          actionUrl: `/worker/tasks`,
        });
      }
    } else {
      // ── REJECT: Return complaint to in_progress ──
      await db.collection("complaints").doc(complaintId).update({
        status: "in_progress",
        updatedAt: now,
      });

      // Also revert the worker task back to in_progress
      if (complaint.assignedWorkerId) {
        const taskSnap = await db
          .collection("workerTasks")
          .where("complaintId", "==", complaintId)
          .where("workerId", "==", complaint.assignedWorkerId)
          .get();

        for (const taskDoc of taskSnap.docs) {
          await db.collection("workerTasks").doc(taskDoc.id).update({
            status: "in_progress",
            completedAt: null,
            updatedAt: now,
          });
        }
      }

      await logComplaintHistoryServer({
        complaintId,
        actorId: session.uid,
        actorName: session.displayName || "Admin",
        actorRole: "admin",
        action: "reopened",
        previousStatus: "resolution_submitted",
        newStatus: "in_progress",
        notes: `Admin rejected the resolution. Reason: ${reason}`,
      });

      // Notify worker
      if (complaint.assignedWorkerId) {
        await sendNotificationServer({
          userId: complaint.assignedWorkerId,
          title: "Resolution Rejected",
          message: `Your resolution for "${complaint.title}" was rejected. Reason: ${reason}. Please rework.`,
          type: "complaint_status_change",
          relatedComplaintId: complaintId,
          actionUrl: `/worker/tasks`,
        });
      }

      // Notify citizen
      if (complaint.citizenId) {
        await sendNotificationServer({
          userId: complaint.citizenId,
          title: "Resolution Under Rework",
          message: `The resolution for your complaint "${complaint.title}" is being reworked.`,
          type: "complaint_status_change",
          relatedComplaintId: complaintId,
          actionUrl: `/citizen/complaints/${complaintId}`,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("POST /api/admin/complaints/[id]/resolve error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
