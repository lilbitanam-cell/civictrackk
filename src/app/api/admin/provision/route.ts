import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

/**
 * Administrative Provisioning Endpoint
 * Used for bootstrapping or provisioning administrator accounts securely.
 * Protected by ADMIN_PROVISION_SECRET or zero-admin initialization check.
 */
export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase Admin SDK is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password, displayName, secret } = body;

    const expectedSecret =
      process.env.ADMIN_PROVISION_SECRET || process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 32);

    // Verify provisioning authorization
    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();

    // Check if any admin already exists in Firestore
    const existingAdmins = await adminDb
      .collection("users")
      .where("role", "==", "admin")
      .limit(1)
      .get();

    const isFirstAdmin = existingAdmins.empty;

    if (!isFirstAdmin && secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid provisioning secret. Admin creation is restricted." },
        { status: 403 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required to provision an admin account." },
        { status: 400 }
      );
    }

    let uid: string;
    try {
      // Check if user already exists in Firebase Auth
      const existingUser = await adminAuth.getUserByEmail(email);
      uid = existingUser.uid;
      await adminAuth.updateUser(uid, {
        password,
        displayName: displayName || existingUser.displayName || "Municipal Administrator",
      });
    } catch {
      // Create new user in Firebase Auth
      const newUser = await adminAuth.createUser({
        email,
        password,
        displayName: displayName || "Municipal Administrator",
      });
      uid = newUser.uid;
    }

    // Set Admin custom claims
    await adminAuth.setCustomUserClaims(uid, { role: "admin" });

    // Create or update Firestore user doc with 'admin' role
    const now = new Date();
    await adminDb.collection("users").doc(uid).set(
      {
        id: uid,
        email,
        displayName: displayName || "Municipal Administrator",
        role: "admin",
        isActive: true,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      uid,
      message: `Administrator account for ${email} provisioned successfully.`,
    });
  } catch (err: unknown) {
    console.error("Admin provision error:", err);
    const message = err instanceof Error ? err.message : "Failed to provision admin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
