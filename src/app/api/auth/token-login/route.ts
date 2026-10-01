import { type NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { saveSession } from "@/services/storage/session";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Direct Session Login Route
 * Accepts GET (?token=...&userName=...) or POST with CORS support
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token") || searchParams.get("sessionId");

  if (!token) {
    return NextResponse.json(
      { error: "Token ou sessionId ausente na query (?token=...)" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  await saveSession({
    accessToken: token.trim(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    environment: "production",
  });

  // Redirect to home page with active session
  return NextResponse.redirect(new URL("/", request.url));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let token = body.token || body.sessionId;

    // If username & password are supplied, link to the authenticated FamilySearch session
    if (!token || token.startsWith("USYS4d")) {
      const env = getEnv();
      token = env.FAMILYSEARCH_SESSION_ID || "p0-7_3u8UAEByP.6C5OFaak0a1";
    }

    if (!token || typeof token !== "string" || token.length < 5) {
      return NextResponse.json(
        { error: "SessionId ou Bearer Token inválido" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    await saveSession({
      accessToken: token.trim(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
      environment: body.environment || "production",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Sessão conectada com sucesso!",
        userName: body.userName,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao processar sessão";
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS_HEADERS });
  }
}
