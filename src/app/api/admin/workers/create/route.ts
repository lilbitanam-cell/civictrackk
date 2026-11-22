import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    // 1. Verify caller is an authenticated municipal admin
    const session = await getCurrentSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Only municipal administrators can provision worker accounts." },
        { status: 403 }
      );
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase Admin SDK is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password, displayName, departmentId, departmentName, phone } = body;

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, and displayName are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Worker password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // 2. Create the user in Firebase Auth via Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      phoneNumber: phone || undefined,
    });

    // 3. Set trusted custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: "worker",
      departmentId: departmentId || undefined,
    });

    // 4. Create the Firestore user record
    const now = new Date();
    await adminDb.collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      displayName,
      phone: phone || "",
      role: "worker",
      departmentId: departmentId || "",
      departmentName: departmentName || "",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      workerId: userRecord.uid,
      message: `Worker account for ${displayName} created successfully.`,
    });
  } catch (err: unknown) {
    console.error("Worker creation error:", err);
    const message = err instanceof Error ? err.message : "Failed to create worker account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
