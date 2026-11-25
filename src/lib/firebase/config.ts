import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const isClientFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// Safe singleton client initialization
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== "undefined" && isClientFirebaseConfigured) {
  if (isClientFirebaseConfigured) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    // Avoid 10-minute SDK retry hangs if Storage bucket is not provisioned or CORS blocks
    storage.maxUploadRetryTime = 4000;
    storage.maxOperationRetryTime = 4000;
  }
}

export function getClientFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!isClientFirebaseConfigured) {
      throw new Error(
        "Firebase Client is not configured. Please supply NEXT_PUBLIC_FIREBASE_* environment variables."
      );
    }
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getClientAuth(): Auth {
  if (!auth) {
    const initializedApp = getClientFirebaseApp();
    auth = getAuth(initializedApp);
  }
  return auth;
}

export function getClientDb(): Firestore {
  if (!db) {
    const initializedApp = getClientFirebaseApp();
    db = getFirestore(initializedApp);
  }
  return db;
}

export function getClientStorage(): FirebaseStorage {
  if (!storage) {
    const initializedApp = getClientFirebaseApp();
    storage = getStorage(initializedApp);
    storage.maxUploadRetryTime = 4000;
    storage.maxOperationRetryTime = 4000;
  }
  return storage;
}

export { app, auth, db, storage };
