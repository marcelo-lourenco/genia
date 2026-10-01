import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import type { FamilySearchSession } from "@/services/familysearch/oauth";

const COOKIE_NAME = "fs_session";
const PKCE_COOKIE_NAME = "fs_pkce";

/**
 * Derives a 32-byte key from SESSION_SECRET
 */
function getEncryptionKey(): Buffer {
  const secret = getEnv().SESSION_SECRET;
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts an arbitrary object using AES-256-GCM
 */
export function encryptPayload(data: unknown): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const jsonStr = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(jsonStr, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted into single base64url string
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

/**
 * Decrypts a base64url payload encrypted with AES-256-GCM
 */
export function decryptPayload<T>(payload: string): T | null {
  try {
    const key = getEncryptionKey();
    const buffer = Buffer.from(payload, "base64url");

    if (buffer.length < 28) {
      return null;
    }

    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch (error) {
    console.error("Failed to decrypt session payload:", error);
    return null;
  }
}

/**
 * Stores the PKCE code_verifier temporarily in a secure cookie during authorization redirect
 */
export async function setPkceCookie(verifier: string) {
  const cookieStore = await cookies();
  const encrypted = encryptPayload(verifier);

  cookieStore.set(PKCE_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });
}

/**
 * Retrieves and clears the PKCE verifier after token exchange
 */
export async function getAndClearPkceCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(PKCE_COOKIE_NAME);
  if (!cookie) {
    return null;
  }

  cookieStore.delete(PKCE_COOKIE_NAME);
  return decryptPayload<string>(cookie.value);
}

/**
 * Saves the FamilySearch session in an encrypted HttpOnly cookie
 */
export async function saveSession(session: FamilySearchSession) {
  const cookieStore = await cookies();
  const encrypted = encryptPayload(session);

  cookieStore.set(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Retrieves the current FamilySearch session
 */
export async function getSession(): Promise<FamilySearchSession | null> {
  // 1. Check encrypted cookie within request context first (updated dynamically by bookmarklet / login)
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (cookie) {
      const session = decryptPayload<FamilySearchSession>(cookie.value);
      if (session) return session;
    }
  } catch {
    // Cookies not accessible outside Next.js request scope
  }

  // 2. Fallback to direct session token configured in .env if no active cookie
  try {
    const env = getEnv();
    if (env.FAMILYSEARCH_SESSION_ID && env.FAMILYSEARCH_SESSION_ID.length > 5) {
      return {
        accessToken: env.FAMILYSEARCH_SESSION_ID,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
        environment: env.FAMILYSEARCH_ENV,
      };
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Clears the session on logout
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
