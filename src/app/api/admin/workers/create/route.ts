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
    if (!session.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated." },
        { status: 403 }
      );
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase Admin SDK is not configured." },
        { status: 500 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const departmentId = typeof body.departmentId === "string" ? body.departmentId.trim() : "";
    const departmentName = typeof body.departmentName === "string" ? body.departmentName.trim() : "";
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    // Firebase Auth requires E.164 format (+[country][number]) without spaces/dashes
    const normalizedPhone = rawPhone.replace(/[\s()-]/g, "");
    const authPhoneNumber = normalizedPhone.startsWith("+") ? normalizedPhone : undefined;

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
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
        phoneNumber: authPhoneNumber,
      });
    } catch (createErr: unknown) {
      // Surface Firebase Auth errors as 400s instead of 500s
      const errCode = (createErr as any)?.errorInfo?.code || (createErr as any)?.code || "";
      const errMsg = createErr instanceof Error ? createErr.message : "Failed to create user.";
      if (
        errCode === "auth/email-already-exists" ||
        errCode === "auth/phone-number-already-exists" ||
        errCode === "auth/invalid-phone-number" ||
        errCode === "auth/invalid-email"
      ) {
        return NextResponse.json({ error: errMsg }, { status: 400 });
      }
      throw createErr; // re-throw unexpected errors to the outer catch
    }

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
      phone: rawPhone || "",
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
