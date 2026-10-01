import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/familysearch/user";
import { getSession } from "@/services/storage/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const fsUser = await getCurrentUser();
    const displayName = fsUser?.displayName || fsUser?.contactName || "Usuário FamilySearch";
    const usernameRaw = fsUser?.contactName || fsUser?.displayName || "usuario";
    const username = usernameRaw.startsWith("@") ? usernameRaw : `@${usernameRaw}`;

    return NextResponse.json({
      authenticated: true,
      user: {
        name: displayName,
        username: username,
        displayName: displayName,
        contactName: fsUser?.contactName || displayName,
        email: fsUser?.email || "",
        treeUserId: fsUser?.treeUserId || fsUser?.id || "",
        id: fsUser?.id || "",
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
