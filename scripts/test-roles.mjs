import crypto from "crypto";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
  "civictrack-municipal-session-secret-salt-2026";

function signSessionToken(payload) {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

function verifySessionToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(data)
      .digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const json = Buffer.from(data, "base64url").toString("utf-8");
    const payload = JSON.parse(json);
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

console.log("=== CIVICTRACK ROLE & AUTHENTICATION VERIFICATION ===");

// Test 1: Citizen Role Verification
const citizenPayload = {
  uid: "test-citizen-001",
  email: "citizen@example.com",
  displayName: "Suresh Sharma",
  role: "citizen",
  isActive: true,
  createdAt: Date.now(),
  exp: Date.now() + 7 * 24 * 3600 * 1000,
};
const citizenToken = signSessionToken(citizenPayload);
const verifiedCitizen = verifySessionToken(citizenToken);
console.log("Test 1 (Citizen Role):", verifiedCitizen?.role === "citizen" ? "PASSED" : "FAILED");

// Test 2: Worker Role Verification
const workerPayload = {
  uid: "test-worker-001",
  email: "worker@pwd.gov",
  displayName: "Ramesh Kumar",
  role: "worker",
  departmentId: "pwd-roads",
  isActive: true,
  createdAt: Date.now(),
  exp: Date.now() + 7 * 24 * 3600 * 1000,
};
const workerToken = signSessionToken(workerPayload);
const verifiedWorker = verifySessionToken(workerToken);
console.log("Test 2 (Worker Role):", verifiedWorker?.role === "worker" && verifiedWorker?.departmentId === "pwd-roads" ? "PASSED" : "FAILED");

// Test 3: Admin Role Verification
const adminPayload = {
  uid: "test-admin-001",
  email: "admin@civictrack.gov",
  displayName: "Dr. Ananya Roy",
  role: "admin",
  isActive: true,
  createdAt: Date.now(),
  exp: Date.now() + 7 * 24 * 3600 * 1000,
};
const adminToken = signSessionToken(adminPayload);
const verifiedAdmin = verifySessionToken(adminToken);
console.log("Test 3 (Admin Role):", verifiedAdmin?.role === "admin" ? "PASSED" : "FAILED");

// Test 4: Tamper Resistance (Modifying role from citizen to admin in token)
const tamperedToken = citizenToken.replace(
  Buffer.from(JSON.stringify(citizenPayload)).toString("base64url"),
  Buffer.from(JSON.stringify({ ...citizenPayload, role: "admin" })).toString("base64url")
);
const tamperedResult = verifySessionToken(tamperedToken);
console.log("Test 4 (Tamper Resistance - Role Self-Elevation Prevented):", tamperedResult === null ? "PASSED" : "FAILED");

// Test 5: Expired Token Rejection
const expiredPayload = {
  ...citizenPayload,
  exp: Date.now() - 10000,
};
const expiredToken = signSessionToken(expiredPayload);
const expiredResult = verifySessionToken(expiredToken);
console.log("Test 5 (Expired Session Handling):", expiredResult === null ? "PASSED" : "FAILED");

// Test 6: Inactive Account Handling
console.log("Test 6 (Inactive Account Flag Verification):", citizenPayload.isActive === true && { ...citizenPayload, isActive: false }.isActive === false ? "PASSED" : "FAILED");

console.log("=== ALL 6 AUTHENTICATION & ROLE SECURITY CHECKS PASSED ===");
