import { type NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/services/familysearch/oauth";
import { getAndClearPkceCookie, saveSession } from "@/services/storage/session";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("FamilySearch OAuth error returned:", error, errorDescription);
    const redirectUrl = new URL(
      `/?auth_error=${encodeURIComponent(errorDescription || error)}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    const redirectUrl = new URL("/?auth_error=missing_authorization_code", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const codeVerifier = await getAndClearPkceCookie();
    if (!codeVerifier) {
      console.error("Missing or expired PKCE code verifier in cookie");
      const redirectUrl = new URL("/?auth_error=expired_pkce_verifier", request.url);
      return NextResponse.redirect(redirectUrl);
    }

    const session = await exchangeCodeForTokens(code, codeVerifier);
    await saveSession(session);

    const redirectUrl = new URL("/?auth=success", request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Failed to complete OAuth callback:", err);
    const redirectUrl = new URL("/?auth_error=token_exchange_failed", request.url);
    return NextResponse.redirect(redirectUrl);
  }
}
