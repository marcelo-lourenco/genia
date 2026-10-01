import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/familysearch/user";
import { getSession } from "@/services/storage/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      environment: null,
    });
  }

  const user = await getCurrentUser();

  return NextResponse.json({
    authenticated: true,
    environment: session.environment,
    expiresAt: session.expiresAt,
    user,
  });
}
