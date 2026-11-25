import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getComplaintsServer } from "@/services/server/complaints.server";
import { logComplaintHistoryServer } from "@/services/server/history.server";
import { sendNotificationServer } from "@/services/server/notifications.server";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { ComplaintCategory, ComplaintStatus, ComplaintPriority } from "@/types";

const VALID_PRIORITIES = new Set<ComplaintPriority>(["low", "medium", "high", "urgent"]);

function generateTicketNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CT-${year}${month}-${random}`;
}

function sanitizeLocation(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const loc = raw as Record<string, unknown>;
  const address = typeof loc.address === "string" ? loc.address.trim() : "";
  if (!address) return null;

  const cleaned: Record<string, unknown> = {
    latitude: typeof loc.latitude === "number" ? loc.latitude : 0,
    longitude: typeof loc.longitude === "number" ? loc.longitude : 0,
    address,
  };
  if (typeof loc.city === "string" && loc.city.trim()) {
    cleaned.city = loc.city.trim();
  }
  if (typeof loc.landmark === "string" && loc.landmark.trim()) {
    cleaned.landmark = loc.landmark.trim();
  }
  if (typeof loc.ward === "string" && loc.ward.trim()) {
    cleaned.ward = loc.ward.trim();
  }
  return cleaned;
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
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: "Account is deactivated." }, { status: 403 });
    }
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Server database credentials are not configured." },
        { status: 500 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const categoryLabel =
      typeof body.categoryLabel === "string" && body.categoryLabel.trim()
        ? body.categoryLabel.trim()
        : category;
    const rawPriority = typeof body.priority === "string" ? body.priority.trim() : "medium";
    const priority: ComplaintPriority = VALID_PRIORITIES.has(rawPriority as ComplaintPriority)
      ? (rawPriority as ComplaintPriority)
      : "medium";
    const location = sanitizeLocation(body.location);
    const images = Array.isArray(body.images)
      ? body.images.filter((u): u is string => typeof u === "string" && u.length > 0)
      : [];
    const citizenPhone =
      typeof body.citizenPhone === "string" && body.citizenPhone.trim()
        ? body.citizenPhone.trim()
        : null;

    // Bind citizenId directly to verified session UID for citizens to prevent spoofing or client-cache mismatches
    const effectiveCitizenId =
      session.role === "citizen" || !body.citizenId || typeof body.citizenId !== "string"
        ? session.uid
        : body.citizenId;

    const citizenName =
      (typeof body.citizenName === "string" && body.citizenName.trim()) ||
      session.displayName ||
      session.email ||
      "Citizen Resident";

    if (!title || !description || !category || !location) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, category, and location address are required." },
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
      categoryLabel,
      priority,
      location,
      images,
      citizenId: effectiveCitizenId,
      citizenName,
      citizenPhone,
      ticketNumber,
      status: "submitted" as ComplaintStatus,
      upvotesCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const complaintId = docRef.id;

    // Log audit trail (non-fatal if logging fails)
    try {
      await logComplaintHistoryServer({
        complaintId,
        actorId: effectiveCitizenId,
        actorName: citizenName,
        actorRole: session.role === "admin" ? "admin" : "citizen",
        action: "submitted",
        newStatus: "submitted",
        notes: `Complaint filed under ticket ${ticketNumber}.`,
      });
    } catch (histErr) {
      console.error("Complaint history logging error (non-fatal):", histErr);
    }

    // Notify all admins (non-fatal)
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
      console.error("Admin notification error (non-fatal):", notifErr);
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
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: "Account is deactivated." }, { status: 403 });
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
