import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAdminAuth,
  getAdminDb,
  getAdminCredentials,
  isFirebaseAdminConfigured,
  isAdminConfigured,
} from "@/lib/firebase/admin";
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
      const adminCreds = getAdminCredentials();
      console.log("[Auth Session] ID Token received. Checking Admin credentials...", {
        hasProjectId: Boolean(adminCreds.projectId),
        hasClientEmail: Boolean(adminCreds.clientEmail),
        hasPrivateKey: Boolean(adminCreds.privateKey),
      });

      if (!adminCreds.isConfigured) {
        console.error(
          "[Auth Session] Firebase Admin SDK is missing credentials:",
          {
            projectId: Boolean(adminCreds.projectId),
            clientEmail: Boolean(adminCreds.clientEmail),
            hasPrivateKey: Boolean(adminCreds.privateKey),
          }
        );
        return NextResponse.json(
          {
            error:
              "Firebase Admin credentials are not configured on the server. Please check FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in your Vercel Environment Variables.",
            step: "check_admin_credentials",
            diagnostic: {
              hasProjectId: Boolean(adminCreds.projectId),
              hasClientEmail: Boolean(adminCreds.clientEmail),
              hasPrivateKey: Boolean(adminCreds.privateKey),
            },
          },
          { status: 500 }
        );
      }

      let adminAuth;
      let adminDb;
      try {
        adminAuth = getAdminAuth();
        adminDb = getAdminDb();
        console.log("[Auth Session] Firebase Admin SDK initialized successfully.");
      } catch (initErr: unknown) {
        console.error("[Auth Session] Failed to initialize Firebase Admin SDK:", initErr);
        const msg = initErr instanceof Error ? initErr.message : "Firebase Admin initialization error.";
        return NextResponse.json(
          {
            error: `Firebase Admin initialization error: ${msg}`,
            step: "admin_init",
            diagnostic: {
              hasProjectId: Boolean(adminCreds.projectId),
              hasClientEmail: Boolean(adminCreds.clientEmail),
              hasPrivateKey: Boolean(adminCreds.privateKey),
            },
          },
          { status: 500 }
        );
      }

      // Verify ID token cryptographically
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
        console.log("[Auth Session] ID token verified successfully. UID:", decodedToken.uid);
      } catch (verifyErr: unknown) {
        console.error("[Auth Session] Firebase verifyIdToken error:", verifyErr);
        const msg = verifyErr instanceof Error ? verifyErr.message : "Invalid or expired Firebase ID token.";
        return NextResponse.json(
          {
            error: `Invalid or expired Firebase ID token: ${msg}`,
            step: "verify_id_token",
          },
          { status: 401 }
        );
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
        console.log("[Auth Session] User profile lookup:", { uid, exists: userSnap.exists });
      } catch (dbErr: unknown) {
        console.error("[Auth Session] Firestore error while reading user profile:", dbErr);
        const msg = dbErr instanceof Error ? dbErr.message : "Database error while reading user profile.";
        return NextResponse.json(
          {
            error: `Firestore error reading user profile: ${msg}`,
            step: "firestore_read_user",
          },
          { status: 500 }
        );
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
          console.log("[Auth Session] Successfully created new citizen Firestore profile for UID:", uid);
        } catch (setErr: unknown) {
          console.error("[Auth Session] Firestore user creation error:", setErr);
          const msg = setErr instanceof Error ? setErr.message : "Database error creating user profile.";
          return NextResponse.json(
            {
              error: `Database error creating user profile: ${msg}`,
              step: "firestore_create_user",
            },
            { status: 500 }
          );
        }
        role = "citizen";
      } else {
        const userData = userSnap.data();
        const rawRole = String(userData?.role || "citizen");
        role = isValidRole(rawRole) ? rawRole : "citizen";
        departmentId = userData?.departmentId || undefined;
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

      // Sync custom claims (preserving departmentId for workers/dept admins)
      const tokenDeptId = decodedToken.departmentId || undefined;
      if (decodedToken.role !== role || tokenDeptId !== departmentId) {
        try {
          const claims: Record<string, unknown> = { role };
          if (departmentId) claims.departmentId = departmentId;
          await adminAuth.setCustomUserClaims(uid, claims);
          console.log("[Auth Session] Custom claims synced for UID:", uid, "Role:", role);
        } catch (claimErr: unknown) {
          console.warn("[Auth Session] Failed to set custom claim (non-fatal):", claimErr);
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

      const token = await signSessionToken(payload);

      cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: Math.floor(SESSION_EXPIRY_MS / 1000),
      });

      console.log("[Auth Session] Session successfully established for UID:", uid, "Role:", role);

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
      if (process.env.NODE_ENV === "production" && isFirebaseAdminConfigured()) {
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

      const token = await signSessionToken(payload);

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
    console.error("[Auth Session] Session creation error:", err);
    const message = err instanceof Error ? err.message : "Internal authentication error.";
    return NextResponse.json({ error: message, step: "unhandled_post_error" }, { status: 500 });
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
