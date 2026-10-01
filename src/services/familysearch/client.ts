import { getSession, saveSession } from "@/services/storage/session";
import { getFamilySearchEndpoints, refreshAccessToken } from "./oauth";

export interface RequestOptions extends RequestInit {
  retryCount?: number;
  maxRetries?: number;
  requiresAuth?: boolean;
}

export class FamilySearchApiError extends Error {
  status: number;
  responseBody?: string;

  constructor(message: string, status: number, responseBody?: string) {
    super(message);
    this.name = "FamilySearchApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

/**
 * Calculates exponential backoff with jitter
 */
export function calculateBackoffDelay(
  retryIndex: number,
  baseDelayMs = 1000,
  maxDelayMs = 10000,
): number {
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** retryIndex);
  const jitter = Math.floor(Math.random() * 500); // 0-500ms jitter
  return exponential + jitter;
}

/**
 * Sleeps for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resilient HTTP client for FamilySearch REST API with rate-limiting backoff and auto-refresh
 */
export async function familySearchFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    retryCount = 0,
    requiresAuth = true,
    headers = {},
    ...fetchOptions
  } = options;

  let session = await getSession();

  // If authentication is required and token is expired or close to expiration, refresh proactively
  if (requiresAuth) {
    if (!session) {
      throw new FamilySearchApiError("User is not authenticated with FamilySearch", 401);
    }

    if (Date.now() >= session.expiresAt && session.refreshToken) {
      try {
        session = await refreshAccessToken(session.refreshToken);
        await saveSession(session);
      } catch (refreshErr) {
        console.error("Proactive token refresh failed:", refreshErr);
      }
    }
  }

  const endpoints = getFamilySearchEndpoints(session?.environment);
  const url = path.startsWith("http")
    ? path
    : `${endpoints.apiUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set(
      "Accept",
      "application/json, application/x-gedcomx-atom+json, application/x-gedcomx-v1+json",
    );
  }

  if (requiresAuth && session?.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // 1. Handle Rate Limiting (HTTP 429 Too Many Requests)
    if (response.status === 429) {
      if (retryCount < maxRetries) {
        let delayMs = calculateBackoffDelay(retryCount);

        const retryAfterHeader = response.headers.get("Retry-After");
        if (retryAfterHeader) {
          const parsedSec = Number.parseInt(retryAfterHeader, 10);
          if (!Number.isNaN(parsedSec)) {
            delayMs = parsedSec * 1000;
          }
        }

        console.warn(
          `[FamilySearch] 429 Rate limited on ${path}. Retrying in ${delayMs}ms (attempt ${retryCount + 1}/${maxRetries})...`,
        );
        await sleep(delayMs);

        return familySearchFetch<T>(path, {
          ...options,
          retryCount: retryCount + 1,
        });
      }

      throw new FamilySearchApiError("FamilySearch rate limit exceeded. Max retries reached.", 429);
    }

    // 2. Handle Token Expiration (HTTP 401 Unauthorized)
    if (response.status === 401 && requiresAuth && session?.refreshToken && retryCount === 0) {
      console.warn(`[FamilySearch] 401 Unauthorized on ${path}. Attempting token refresh...`);
      try {
        const newSession = await refreshAccessToken(session.refreshToken);
        await saveSession(newSession);

        return familySearchFetch<T>(path, {
          ...options,
          retryCount: retryCount + 1,
        });
      } catch (_refreshError) {
        throw new FamilySearchApiError("Session expired and could not be renewed.", 401);
      }
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new FamilySearchApiError(
        `FamilySearch API Error (${response.status}): ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("json")) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (error) {
    if (error instanceof FamilySearchApiError) {
      throw error;
    }

    // Network error retry
    if (retryCount < maxRetries) {
      const delayMs = calculateBackoffDelay(retryCount);
      console.warn(`[FamilySearch] Network failure on ${path}. Retrying in ${delayMs}ms...`, error);
      await sleep(delayMs);
      return familySearchFetch<T>(path, {
        ...options,
        retryCount: retryCount + 1,
      });
    }

    throw new FamilySearchApiError(
      `Network or unexpected error calling FamilySearch: ${error}`,
      500,
    );
  }
}
