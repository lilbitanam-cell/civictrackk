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

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: complaintId } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await verifySessionToken(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
    }

    let body: { action?: unknown; reason?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const action = body.action;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    if (action === "reject" && !reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const complaint = await getComplaintDocumentByIdServer(complaintId);
    if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

    const db = getAdminDb();
    const now = new Date();

    if (action === "approve") {
      await db.collection("complaints").doc(complaintId).update({
        status: "under_review",
        updatedAt: now,
      });
      await logComplaintHistoryServer({
        complaintId,
        actorId: session.uid,
        actorName: session.displayName || "Admin",
        actorRole: "admin",
        action: "status_changed",
        previousStatus: complaint.status,
        newStatus: "under_review",
        notes: "Admin verified and moved complaint to under review.",
      });
      if (complaint.citizenId) {
        await sendNotificationServer({
          userId: complaint.citizenId,
          title: "Complaint Under Review",
          message: `Your complaint "${complaint.title}" is now being reviewed by municipal staff.`,
          type: "complaint_status_change",
          relatedComplaintId: complaintId,
          actionUrl: `/citizen/complaints/${complaintId}`,
        });
      }
    } else {
      await db.collection("complaints").doc(complaintId).update({
        status: "rejected",
        rejectionReason: reason,
        updatedAt: now,
      });
      await logComplaintHistoryServer({
        complaintId,
        actorId: session.uid,
        actorName: session.displayName || "Admin",
        actorRole: "admin",
        action: "status_changed",
        previousStatus: complaint.status,
        newStatus: "rejected",
        notes: `Complaint rejected. Reason: ${reason}`,
      });
      if (complaint.citizenId) {
        await sendNotificationServer({
          userId: complaint.citizenId,
          title: "Complaint Rejected",
          message: `Your complaint "${complaint.title}" was rejected. Reason: ${reason}`,
          type: "complaint_status_change",
          relatedComplaintId: complaintId,
          actionUrl: `/citizen/complaints/${complaintId}`,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
