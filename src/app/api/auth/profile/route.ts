import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { getCurrentUser } from "@/services/familysearch/user";
import { getSession } from "@/services/storage/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const fsUser = await getCurrentUser();
    const env = getEnv();

    const username = env.FAMILYSEARCH_USER_NAME || "MarceloLourenço6";

    return NextResponse.json({
      authenticated: true,
      user: {
        name:
          fsUser?.displayName ||
          fsUser?.contactName ||
          env.FAMILYSEARCH_USER_NAME ||
          "Marcelo Lourenço",
        username: username.startsWith("@") ? username : `@${username}`,
        displayName: fsUser?.displayName || "Marcelo Lourenço",
        contactName: fsUser?.contactName || "Marcelo Lourenço",
        email: fsUser?.email || "marcelo.lourenco@familysearch.org",
        treeUserId: fsUser?.treeUserId || fsUser?.id || "GYT8-36P",
        id: fsUser?.id || "GYT8-36P",
        avatarUrl: null, // Sem placeholder - usa fallback com iniciais
      },
      session: {
        environment: session.environment || "production",
        expiresAt: session.expiresAt,
        tokenMasked: `${session.accessToken.substring(0, 8)}...${session.accessToken.substring(session.accessToken.length - 4)}`,
        rawToken: session.accessToken,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao carregar perfil";
    return NextResponse.json({ authenticated: false, error: msg }, { status: 500 });
  }
}
