/**
 * CivicTrack Admin Provisioning CLI Tool
 * Run via: node scripts/create-admin.mjs <email> <password> [displayName]
 */

import admin from "firebase-admin";

const [email, password, displayName = "Municipal Administrator"] = process.argv.slice(2);

if (!email || !password) {
  console.log("Usage: node scripts/create-admin.mjs <email> <password> [displayName]");
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !rawKey) {
  console.error("Missing FIREBASE_ADMIN_* environment variables.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: rawKey.replace(/\\n/g, "\n"),
  }),
});

async function provisionAdmin() {
  const auth = admin.auth();
  const db = admin.firestore();

  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`Found existing Firebase user: ${uid}`);
  } catch {
    const created = await auth.createUser({
      email,
      password,
      displayName,
    });
    uid = created.uid;
    console.log(`Created new Firebase user: ${uid}`);
  }

  await auth.setCustomUserClaims(uid, { role: "admin" });
  console.log("Applied custom claims: { role: 'admin' }");

  await db.collection("users").doc(uid).set(
    {
      id: uid,
      email,
      displayName,
      role: "admin",
      isActive: true,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  console.log(`Successfully provisioned Admin: ${email} (${uid})`);
  process.exit(0);
}

provisionAdmin().catch((err) => {
  console.error("Failed to provision admin:", err);
  process.exit(1);
});
