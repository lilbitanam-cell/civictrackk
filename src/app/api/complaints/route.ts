import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { createComplaint, getComplaints } from "@/services/complaints.service";
import { sendNotification } from "@/services/notifications.service";
import { getClientDb } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { ComplaintCategory, ComplaintStatus } from "@/types";

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

    if (!title || !description || !category || !location || !citizenId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const complaintId = await createComplaint({
      title,
      description,
      category,
      categoryLabel,
      priority: priority || "medium",
      location,
      images: images || [],
      citizenId,
      citizenName,
      citizenPhone,
    });

    // Notify all admins
    try {
      const db = getClientDb();
      const usersRef = collection(db, "users");
      const adminQuery = query(usersRef, where("role", "==", "admin"));
      const adminSnap = await getDocs(adminQuery);

      const notifPromises = adminSnap.docs.map((adminDoc) =>
        sendNotification({
          userId: adminDoc.id,
          title: "New Complaint Submitted",
          message: `A new complaint "${title}" has been filed (Ticket: ${complaintId}).`,
          type: "complaint_submitted",
          relatedComplaintId: complaintId,
          actionUrl: `/admin/complaints/${complaintId}`,
        })
      );
      await Promise.all(notifPromises);
    } catch (notifErr) {
      // Notification failure should not block the complaint creation
      console.error("Admin notification error:", notifErr);
    }

    return NextResponse.json({ success: true, complaintId });
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
      complaints = await getComplaints({ citizenId: session.uid });
    } else if (session.role === "admin") {
      complaints = await getComplaints({
        ...(statusParam ? { status: statusParam } : {}),
        ...(categoryParam ? { category: categoryParam } : {}),
      });
    } else if (session.role === "worker") {
      complaints = await getComplaints({ assignedWorkerId: session.uid });
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
