import { type NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/services/storage/session";

export async function GET(request: NextRequest) {
  await clearSession();
  const redirectUrl = new URL("/?auth=logged_out", request.url);
  return NextResponse.redirect(redirectUrl);
}

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
