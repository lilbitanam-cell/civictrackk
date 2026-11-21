import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import {
  signSessionToken,
  getCurrentSession,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_MS,
  SessionPayload,
} from "@/lib/auth/session";
import { ROLE_HOME_ROUTES, isValidRole } from "@/lib/auth";
import { UserRole } from "@/types";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      uid: session.uid,
      email: session.email,
      displayName: session.displayName,
      role: session.role,
      departmentId: session.departmentId,
    },
  });
}

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }
    const { idToken, devRole } = body;

    const cookieStore = await cookies();

    // 1. Live Firebase ID Token Verification
    if (idToken) {
      if (!isAdminConfigured) {
        console.error("Firebase Admin SDK is missing server credentials (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY)");
        return NextResponse.json(
          {
            error:
              "Firebase Admin credentials are not configured on the server. Please check your Vercel Environment Variables.",
          },
          { status: 500 }
        );
      }

      let adminAuth;
      let adminDb;
      try {
        adminAuth = getAdminAuth();
        adminDb = getAdminDb();
      } catch (initErr: unknown) {
        console.error("Failed to initialize Firebase Admin SDK:", initErr);
        const msg = initErr instanceof Error ? initErr.message : "Firebase Admin initialization error.";
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      // Verify ID token cryptographically
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (verifyErr: unknown) {
        console.error("Firebase verifyIdToken error:", verifyErr);
        const msg = verifyErr instanceof Error ? verifyErr.message : "Invalid or expired Firebase ID token.";
        return NextResponse.json({ error: msg }, { status: 401 });
      }

      const uid = decodedToken.uid;
      const email = decodedToken.email || null;
      const displayName = decodedToken.name || null;

      // Fetch user profile from Firestore using Admin privileges
      let userDocRef;
      let userSnap;
      try {
        userDocRef = adminDb.collection("users").doc(uid);
        userSnap = await userDocRef.get();
      } catch (dbErr: unknown) {
        console.error("Firestore error while reading user profile:", dbErr);
        const msg = dbErr instanceof Error ? dbErr.message : "Database error while reading user profile.";
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      let role: UserRole = "citizen";
      let departmentId: string | undefined;
      let isActive = true;

      if (!userSnap.exists) {
        // First-time public/Google signup: ALWAYS assign role 'citizen'
        const now = new Date();
        try {
          await userDocRef.set({
            id: uid,
            email: email || "",
            displayName: displayName || "Citizen Resident",
            role: "citizen",
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        } catch (setErr: unknown) {
          console.error("Firestore user creation error:", setErr);
          const msg = setErr instanceof Error ? setErr.message : "Database error creating user profile.";
          return NextResponse.json({ error: msg }, { status: 500 });
        }
        role = "citizen";
      } else {
        const userData = userSnap.data();
        role = (userData?.role as UserRole) || "citizen";
        departmentId = userData?.departmentId;
        isActive = userData?.isActive !== false;
      }

      // Check account active status
      if (!isActive) {
        return NextResponse.json(
          {
            error:
              "This account has been deactivated by the municipal administration. Please contact your department.",
          },
          { status: 403 }
        );
      }

      // Sync custom claims
      if (decodedToken.role !== role) {
        try {
          await adminAuth.setCustomUserClaims(uid, { role });
        } catch (claimErr: unknown) {
          console.warn("Failed to set custom claim (non-fatal):", claimErr);
        }
      }

      const now = Date.now();
      const payload: SessionPayload = {
        uid,
        email,
        displayName,
        role,
        departmentId,
        isActive: true,
        createdAt: now,
        exp: now + SESSION_EXPIRY_MS,
      };

      const token = signSessionToken(payload);

      cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: Math.floor(SESSION_EXPIRY_MS / 1000),
      });

      return NextResponse.json({
        success: true,
        role,
        redirectTo: ROLE_HOME_ROUTES[role],
        user: {
          uid: payload.uid,
          email: payload.email,
          displayName: payload.displayName,
          role: payload.role,
        },
      });
    }

    // 2. Development Role Testing Mode (Available when live Firebase is pending or testing)
    if (devRole && isValidRole(devRole)) {
      if (process.env.NODE_ENV === "production" && isAdminConfigured) {
        return NextResponse.json(
          { error: "Development role testing is not permitted in production." },
          { status: 403 }
        );
      }

      const testUids: Record<UserRole, { uid: string; email: string; name: string }> = {
        citizen: {
          uid: "test-citizen-001",
          email: "citizen.test@civictrack.local",
          name: "Suresh Sharma (Citizen)",
        },
        worker: {
          uid: "test-worker-001",
          email: "worker.pwd@civictrack.local",
          name: "Ramesh Kumar (Field Worker - PWD)",
        },
        admin: {
          uid: "test-admin-001",
          email: "admin.hq@civictrack.local",
          name: "Dr. Ananya Roy (Municipal Admin)",
        },
      };

      const target = testUids[devRole];
      const now = Date.now();
      const payload: SessionPayload = {
        uid: target.uid,
        email: target.email,
        displayName: target.name,
        role: devRole,
        departmentId: devRole === "worker" ? "pwd-roads" : undefined,
        isActive: true,
        createdAt: now,
        exp: now + SESSION_EXPIRY_MS,
      };

      const token = signSessionToken(payload);

      cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: Math.floor(SESSION_EXPIRY_MS / 1000),
      });

      return NextResponse.json({
        success: true,
        role: devRole,
        redirectTo: ROLE_HOME_ROUTES[devRole],
        user: {
          uid: payload.uid,
          email: payload.email,
          displayName: payload.displayName,
          role: payload.role,
        },
        mode: "development_role_test",
      });
    }

    return NextResponse.json(
      { error: "Invalid authentication request. Missing credentials." },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("Session creation error:", err);
    const message = err instanceof Error ? err.message : "Internal authentication error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({
    success: true,
    message: "Session ended successfully.",
  });
}
