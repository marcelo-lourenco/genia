import assert from "node:assert/strict";
import test from "node:test";

process.env.FAMILYSEARCH_CLIENT_ID = "test_client_id_123";
process.env.GEMINI_API_KEY = "test_gemini_key_123";
process.env.SESSION_SECRET = "mock_session_secret_at_least_32_characters_long!";

import {
  buildAuthorizationUrl,
  generatePkcePair,
  getFamilySearchEndpoints,
} from "@/services/familysearch/oauth";
import { decryptPayload, encryptPayload } from "@/services/storage/session";

test("PKCE generator creates valid code_verifier and code_challenge", () => {
  const { codeVerifier, codeChallenge } = generatePkcePair();

  assert.ok(codeVerifier.length >= 43 && codeVerifier.length <= 128, "Verifier length valid");
  assert.ok(codeChallenge.length >= 43, "Challenge generated");
  assert.notEqual(codeVerifier, codeChallenge, "Challenge is hashed verifier");
});

test("buildAuthorizationUrl constructs valid OAuth2 authorization URL", () => {
  const { codeChallenge } = generatePkcePair();
  const urlString = buildAuthorizationUrl(codeChallenge, "test_state_123");
  const url = new URL(urlString);

  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("code_challenge"), codeChallenge);
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("state"), "test_state_123");
});

test("Endpoints resolution returns correct Sandbox and Production URLs", () => {
  const sandbox = getFamilySearchEndpoints("sandbox");
  assert.equal(
    sandbox.authUrl,
    "https://identbeta.familysearch.org/cis-web/oauth2/v3/authorization",
  );
  assert.equal(sandbox.apiUrl, "https://api-integ.familysearch.org");

  const prod = getFamilySearchEndpoints("production");
  assert.equal(prod.authUrl, "https://ident.familysearch.org/cis-web/oauth2/v3/authorization");
  assert.equal(prod.apiUrl, "https://api.familysearch.org");
});

test("Session encryption and decryption with AES-256-GCM works roundtrip", () => {
  const payload = {
    accessToken: "test_access_token_12345",
    refreshToken: "test_refresh_token_67890",
    expiresAt: Date.now() + 3600000,
    environment: "sandbox" as const,
  };

  const encrypted = encryptPayload(payload);
  assert.ok(typeof encrypted === "string" && encrypted.length > 30);

  const decrypted = decryptPayload<typeof payload>(encrypted);
  assert.deepEqual(decrypted, payload);
});
