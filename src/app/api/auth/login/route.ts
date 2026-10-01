import { NextResponse } from "next/server";
import { buildAuthorizationUrl, generatePkcePair } from "@/services/familysearch/oauth";
import { setPkceCookie } from "@/services/storage/session";

export async function GET() {
  try {
    const { codeVerifier, codeChallenge } = generatePkcePair();

    await setPkceCookie(codeVerifier);

    const authUrl = buildAuthorizationUrl(codeChallenge);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Failed to initiate OAuth login:", error);
    return NextResponse.json(
      { error: "Failed to initiate FamilySearch authentication" },
      { status: 500 },
    );
  }
}
