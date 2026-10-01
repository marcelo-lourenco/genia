import crypto from "node:crypto";
import { getEnv } from "@/lib/env";

export interface FamilySearchTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface FamilySearchSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in ms
  environment: "sandbox" | "production";
}

/**
 * Generates high-entropy cryptographic PKCE strings
 */
export function generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
  // 64 random bytes encoded as base64url (approx 86 chars, well within 43-128 range)
  const codeVerifier = crypto.randomBytes(64).toString("base64url");

  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  return { codeVerifier, codeChallenge };
}

/**
 * Returns OAuth2 & API base endpoints according to configuration
 */
export function getFamilySearchEndpoints(envOverride?: "sandbox" | "production") {
  const env = envOverride || getEnv().FAMILYSEARCH_ENV;

  if (env === "production") {
    return {
      authUrl: "https://ident.familysearch.org/cis-web/oauth2/v3/authorization",
      tokenUrl: "https://ident.familysearch.org/cis-web/oauth2/v3/token",
      apiUrl: "https://api.familysearch.org",
    };
  }

  return {
    authUrl: "https://identbeta.familysearch.org/cis-web/oauth2/v3/authorization",
    tokenUrl: "https://identbeta.familysearch.org/cis-web/oauth2/v3/token",
    apiUrl: "https://api-integ.familysearch.org",
  };
}

/**
 * Constructs the FamilySearch OAuth2 Authorization URL
 */
export function buildAuthorizationUrl(codeChallenge: string, state?: string): string {
  const env = getEnv();
  const endpoints = getFamilySearchEndpoints();

  const url = new URL(endpoints.authUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.FAMILYSEARCH_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.FAMILYSEARCH_REDIRECT_URI);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  if (state) {
    url.searchParams.set("state", state);
  }

  return url.toString();
}

/**
 * Exchanges authorization code for Access & Refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<FamilySearchSession> {
  const env = getEnv();
  const endpoints = getFamilySearchEndpoints();

  const bodyParams = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.FAMILYSEARCH_CLIENT_ID,
    redirect_uri: env.FAMILYSEARCH_REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  if (env.FAMILYSEARCH_CLIENT_SECRET) {
    bodyParams.set("client_secret", env.FAMILYSEARCH_CLIENT_SECRET);
  }

  const response = await fetch(endpoints.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code for token (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as FamilySearchTokenResponse;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    // Buffer expiration by 60 seconds to refresh proactively
    expiresAt: Date.now() + Math.max(0, (data.expires_in - 60) * 1000),
    environment: env.FAMILYSEARCH_ENV,
  };
}

/**
 * Refreshes an expired access token using the rotating refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<FamilySearchSession> {
  const env = getEnv();
  const endpoints = getFamilySearchEndpoints();

  const bodyParams = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: env.FAMILYSEARCH_CLIENT_ID,
  });

  if (env.FAMILYSEARCH_CLIENT_SECRET) {
    bodyParams.set("client_secret", env.FAMILYSEARCH_CLIENT_SECRET);
  }

  const response = await fetch(endpoints.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh token (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as FamilySearchTokenResponse;

  return {
    accessToken: data.access_token,
    // FamilySearch rotates refresh_tokens; if new one provided use it, otherwise keep current
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + Math.max(0, (data.expires_in - 60) * 1000),
    environment: env.FAMILYSEARCH_ENV,
  };
}
