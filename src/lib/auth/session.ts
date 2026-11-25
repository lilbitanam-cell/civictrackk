/**
 * Session token signing and verification using the Web Crypto API (crypto.subtle).
 * This is fully compatible with both the Next.js Edge Runtime (middleware) and
 * Node.js (API routes, Server Components). The old Node.js `crypto` module is
 * NOT used here — it is unavailable in Edge.
 */
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

// ─── Web Crypto helpers ───────────────────────────────────────────────────────

/**
 * Import the HMAC-SHA256 key once per module lifetime.
 * Caching avoids repeated key derivation on every request.
 */
let _cachedKey: CryptoKey | undefined;
async function getHmacKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;
  const enc = new TextEncoder();
  _cachedKey = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return _cachedKey;
}

/** Convert an ArrayBuffer or Uint8Array to a URL-safe base64 string (no padding). */
function toBase64Url(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Convert a URL-safe base64 string back to a Uint8Array. */
function fromBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Re-add stripped padding
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Encode a SessionPayload to a URL-safe base64 string. */
function encodePayload(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return toBase64Url(bytes);
}

/** Decode a URL-safe base64 string back to a SessionPayload. Returns null on failure. */
function decodePayload(data: string): SessionPayload | null {
  try {
    const bytes = fromBase64Url(data);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a cryptographically signed session token: base64url(payload).base64url(hmac)
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const data = encodePayload(payload);
  const key = await getHmacKey();
  const sigBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  const signature = toBase64Url(sigBuffer);
  return `${data}.${signature}`;
}

/**
 * Verifies a signed session token using a constant-time HMAC comparison
 * (crypto.subtle.verify is constant-time by spec — prevents timing attacks).
 * Returns the SessionPayload if valid and not expired, otherwise null.
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [data, signature] = parts;
    const key = await getHmacKey();

    const isValid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      new TextEncoder().encode(data)
    );
    if (!isValid) return null;

    const payload = decodePayload(data);
    if (!payload) return null;

    // Check expiry
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to read the current authenticated session from cookies.
 * For use in Server Components and API Route handlers only (not middleware).
 * Middleware reads cookies directly from the request object via src/proxy.ts.
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) return null;
    return await verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}
