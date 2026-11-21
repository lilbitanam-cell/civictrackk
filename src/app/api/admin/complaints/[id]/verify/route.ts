import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getComplaintById } from "@/services/complaints.service";
import { logComplaintHistory } from "@/services/history.service";
import { sendNotification } from "@/services/notifications.service";
import { getClientDb } from "@/lib/firebase/config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: complaintId } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = verifySessionToken(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const { action, reason } = await request.json() as { action: "approve" | "reject"; reason?: string };

    if (action === "reject" && !reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const complaint = await getComplaintById(complaintId);
    if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

    const db = getClientDb();
    const docRef = doc(db, "complaints", complaintId);

    if (action === "approve") {
      await updateDoc(docRef, { status: "under_review", updatedAt: serverTimestamp() });
      await logComplaintHistory({
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
        await sendNotification({
          userId: complaint.citizenId,
          title: "Complaint Under Review",
          message: `Your complaint "${complaint.title}" is now being reviewed by municipal staff.`,
          type: "complaint_status_change",
          relatedComplaintId: complaintId,
          actionUrl: `/citizen/complaints/${complaintId}`,
        });
      }
    } else {
      await updateDoc(docRef, {
        status: "rejected",
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });
      await logComplaintHistory({
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
        await sendNotification({
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
