import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getComplaintDocumentByIdServer } from "@/services/server/complaints.server";
import { logComplaintHistoryServer } from "@/services/server/history.server";
import { sendNotificationServer } from "@/services/server/notifications.server";
import { getAdminDb } from "@/lib/firebase/admin";
import { ComplaintStatus, ComplaintPriority } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ALLOWED_UPDATE_FIELDS = new Set([
  "status",
  "priority",
  "departmentId",
  "departmentName",
  "assignedWorkerId",
  "assignedWorkerName",
  "rejectionReason",
  "resolutionNotes",
  "adminRemarks",
]);

// ─── GET /api/complaints/[id] ───────────────────────────────────────────────
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

    const complaint = await getComplaintDocumentByIdServer(id);
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    // Citizens can only see their own complaints
    if (session.role === "citizen" && complaint.citizenId !== session.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, complaint });
  } catch (err: unknown) {
    console.error("GET /api/complaints/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── PATCH /api/complaints/[id] ─────────────────────────────────────────────
// Admin-only: update allowed complaint fields, log history, notify citizen.
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const body = await request.json();

    // Filter only allowed fields
    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (ALLOWED_UPDATE_FIELDS.has(key)) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const complaint = await getComplaintDocumentByIdServer(id);
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const now = new Date();
    updates.updatedAt = now;

    const db = getAdminDb();
    await db.collection("complaints").doc(id).update(updates);

    // Log history
    const previousStatus = complaint.status as ComplaintStatus;
    const newStatus = (updates.status as ComplaintStatus) || previousStatus;

    await logComplaintHistoryServer({
      complaintId: id,
      actorId: session.uid,
      actorName: session.displayName || "Admin",
      actorRole: "admin",
      action: "status_changed",
      previousStatus,
      newStatus,
      notes: `Admin updated complaint fields: ${Object.keys(updates)
        .filter((k) => k !== "updatedAt")
        .join(", ")}.`,
    });

    // Notify citizen
    if (complaint.citizenId) {
      await sendNotificationServer({
        userId: complaint.citizenId,
        title: "Complaint Updated",
        message: `Your complaint "${complaint.title}" has been updated by an administrator.`,
        type: "complaint_status_change",
        relatedComplaintId: id,
        actionUrl: `/citizen/complaints/${id}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("PATCH /api/complaints/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
