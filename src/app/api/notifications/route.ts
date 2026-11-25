import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
    }
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Database service is not configured." },
        { status: 500 }
      );
    }

    let body: { notificationId?: string; markAll?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const db = getAdminDb();

    if (body.markAll) {
      const [byUser, byCitizen] = await Promise.all([
        db.collection("notifications").where("userId", "==", session.uid).get(),
        db.collection("notifications").where("citizenId", "==", session.uid).get(),
      ]);

      const batch = db.batch();
      const seen = new Set<string>();
      for (const d of [...byUser.docs, ...byCitizen.docs]) {
        if (!seen.has(d.id) && d.data().isRead !== true) {
          seen.add(d.id);
          batch.update(d.ref, { isRead: true });
        }
      }
      if (seen.size > 0) await batch.commit();
      return NextResponse.json({ success: true, updated: seen.size });
    }

    if (!body.notificationId) {
      return NextResponse.json(
        { error: "notificationId or markAll is required." },
        { status: 400 }
      );
    }

    const docRef = db.collection("notifications").doc(body.notificationId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const data = snap.data();
    const ownerUid = data?.userId || data?.citizenId;
    if (ownerUid !== session.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await docRef.update({ isRead: true });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("PATCH /api/notifications error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
