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
    const body = await request.json();
    const { idToken, devRole } = body;

    const cookieStore = await cookies();

    // 1. Live Firebase ID Token Verification
    if (idToken) {
      if (!isAdminConfigured) {
        return NextResponse.json(
          {
            error:
              "Firebase Admin SDK is not configured on the server. Please populate FIREBASE_ADMIN_* keys in .env.local.",
          },
          { status: 500 }
        );
      }

      const adminAuth = getAdminAuth();
      const adminDb = getAdminDb();

      // Verify ID token cryptographically
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const email = decodedToken.email || null;
      const displayName = decodedToken.name || null;

      // Fetch user profile from Firestore using Admin privileges
      const userDocRef = adminDb.collection("users").doc(uid);
      const userSnap = await userDocRef.get();

      let role: UserRole = "citizen";
      let departmentId: string | undefined;
      let isActive = true;

      if (!userSnap.exists) {
        // First-time public/Google signup: ALWAYS assign role 'citizen'
        const now = new Date();
        await userDocRef.set({
          id: uid,
          email: email || "",
          displayName: displayName || "Citizen Resident",
          role: "citizen",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
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
        await adminAuth.setCustomUserClaims(uid, { role });
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
