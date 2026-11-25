import { NextResponse } from "next/server";
import { isClientFirebaseConfigured, firebaseConfig } from "@/lib/firebase/config";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  // Restrict this diagnostic endpoint in production to avoid leaking config state
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  // Accessing request properties ensures dynamic request-time evaluation
  const url = new URL(request.url);

  const clientMissing = [
    !firebaseConfig.apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
    !firebaseConfig.authDomain && "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    !firebaseConfig.projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    !firebaseConfig.storageBucket && "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    !firebaseConfig.messagingSenderId && "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    !firebaseConfig.appId && "NEXT_PUBLIC_FIREBASE_APP_ID",
  ].filter(Boolean) as string[];

  const adminMissing = [
    !(process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) && "FIREBASE_ADMIN_PROJECT_ID",
    !(process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL) && "FIREBASE_ADMIN_CLIENT_EMAIL",
    !(process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY) && "FIREBASE_ADMIN_PRIVATE_KEY",
  ].filter(Boolean) as string[];

  const isClientReady = isClientFirebaseConfigured;
  const isAdminReady = isFirebaseAdminConfigured();
  const isFullyConfigured = isClientReady && isAdminReady;

  return NextResponse.json({
    status: isFullyConfigured ? "ready" : "configuration_pending",
    client: {
      ready: isClientReady,
      missing: clientMissing,
    },
    admin: {
      ready: isAdminReady,
      missing: adminMissing,
    },
    message: isFullyConfigured
      ? "Firebase Client and Admin SDKs are properly configured."
      : "Firebase environment variables are pending configuration in .env.local.",
    path: url.pathname,
  });
}
