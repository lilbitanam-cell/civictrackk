import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getComplaintsServer } from "@/services/server/complaints.server";
import { logComplaintHistoryServer } from "@/services/server/history.server";
import { sendNotificationServer } from "@/services/server/notifications.server";
import { getAdminDb } from "@/lib/firebase/admin";
import { ComplaintCategory, ComplaintStatus, ComplaintPriority } from "@/types";

function generateTicketNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CT-${year}${month}-${random}`;
}

// ─── POST /api/complaints ───────────────────────────────────────────────────
// Creates a new complaint and notifies all admins.
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      categoryLabel,
      priority,
      location,
      images,
      citizenId,
      citizenName,
      citizenPhone,
    } = body;

    // Citizens can only file for their own UID
    if (session.role === "citizen" && citizenId !== session.uid) {
      return NextResponse.json({ error: "Forbidden: UID mismatch" }, { status: 403 });
    }

    if (!title || !description || !category || !location || !citizenId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const now = new Date();
    const ticketNumber = generateTicketNumber();

    const docRef = await db.collection("complaints").add({
      title,
      description,
      category,
      categoryLabel: categoryLabel || category,
      priority: priority || "medium",
      location,
      images: images || [],
      citizenId,
      citizenName: citizenName || session.displayName || "Citizen Resident",
      citizenPhone: citizenPhone || null,
      ticketNumber,
      status: "submitted" as ComplaintStatus,
      upvotesCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const complaintId = docRef.id;

    // Automatically log audit trail entry
    await logComplaintHistoryServer({
      complaintId,
      actorId: citizenId,
      actorName: citizenName || session.displayName || "Citizen",
      actorRole: "citizen",
      action: "submitted",
      newStatus: "submitted",
      notes: `Complaint filed under ticket ${ticketNumber}.`,
    });

    // Notify all admins
    try {
      const adminSnap = await db
        .collection("users")
        .where("role", "==", "admin")
        .get();

      const notifPromises = adminSnap.docs.map((adminDoc) =>
        sendNotificationServer({
          userId: adminDoc.id,
          title: "New Complaint Submitted",
          message: `A new complaint "${title}" has been filed (Ticket: ${ticketNumber}).`,
          type: "complaint_submitted",
          relatedComplaintId: complaintId,
          actionUrl: `/admin/complaints/${complaintId}`,
        })
      );
      await Promise.all(notifPromises);
    } catch (notifErr) {
      console.error("Admin notification error:", notifErr);
    }

    return NextResponse.json({ success: true, complaintId, ticketNumber });
  } catch (err: unknown) {
    console.error("POST /api/complaints error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── GET /api/complaints ────────────────────────────────────────────────────
// Lists complaints filtered by role.
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as ComplaintStatus | null;
    const categoryParam = searchParams.get("category") as ComplaintCategory | null;

    let complaints;

    if (session.role === "citizen") {
      complaints = await getComplaintsServer({ citizenId: session.uid });
    } else if (session.role === "admin") {
      complaints = await getComplaintsServer({
        ...(statusParam ? { status: statusParam } : {}),
        ...(categoryParam ? { category: categoryParam } : {}),
      });
    } else if (session.role === "worker") {
      complaints = await getComplaintsServer({ assignedWorkerId: session.uid });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, complaints });
  } catch (err: unknown) {
    console.error("GET /api/complaints error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
