import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

/**
 * Server-only guard: Prevent execution in client-side bundles.
 */
if (typeof window !== "undefined") {
  throw new Error("Firebase Admin SDK must only be invoked in a Node.js server environment.");
}

const adminProjectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "";
const adminClientEmail =
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
  process.env.FIREBASE_CLIENT_EMAIL ||
  "";

function formatPrivateKey(key: string | undefined): string {
  if (!key) return "";
  let cleanKey = key.trim();
  // Strip outer quotes if wrapped like "..." or '...'
  if (
    (cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
    (cleanKey.startsWith("'") && cleanKey.endsWith("'"))
  ) {
    cleanKey = cleanKey.slice(1, -1);
  }
  // Replace literal '\n' sequences with real newlines
  cleanKey = cleanKey.replace(/\\n/g, "\n");
  return cleanKey;
}

const adminPrivateKey = formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY);

export const isAdminConfigured = Boolean(
  adminProjectId && adminClientEmail && adminPrivateKey
);

let adminApp: App | undefined;

export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  if (!isAdminConfigured) {
    throw new Error(
      "Firebase Admin SDK credentials are not configured. Provide FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in your server environment."
    );
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: adminProjectId,
      clientEmail: adminClientEmail,
      privateKey: adminPrivateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
  });

  return adminApp;
}

export function getAdminAuth(): Auth {
  const appInstance = getAdminApp();
  return getAuth(appInstance);
}

export function getAdminDb(): Firestore {
  const appInstance = getAdminApp();
  return getFirestore(appInstance);
}

export function getAdminStorage(): Storage {
  const appInstance = getAdminApp();
  return getStorage(appInstance);
}

export { adminApp };
