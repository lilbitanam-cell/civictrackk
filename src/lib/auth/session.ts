import crypto from "crypto";
import { cookies } from "next/headers";
import { UserRole } from "@/types";

export const SESSION_COOKIE_NAME = "civictrack_session";
export const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionPayload {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  departmentId?: string;
  isActive: boolean;
  createdAt: number;
  exp: number;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
  "civictrack-municipal-session-secret-salt-2026";

/**
 * Creates a cryptographically signed session token string: payload.signature
 */
export function signSessionToken(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verifies and decodes a signed session token. Returns null if invalid or expired.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(data)
      .digest("base64url");

    // Timing-safe comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }

    const json = Buffer.from(data, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as SessionPayload;

    // Check expiration
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to read the current authenticated session from cookies.
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}
