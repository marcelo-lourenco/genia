import { type NextRequest, NextResponse } from "next/server";
import { extractMicrofilmImage } from "@/services/scraper/fallback-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dgsNumber, imageIndex, preferHeadless } = body;

    if (!dgsNumber || typeof dgsNumber !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'dgsNumber'" }, { status: 400 });
    }

    if (!imageIndex || typeof imageIndex !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid 'imageIndex' number" },
        { status: 400 },
      );
    }

    const result = await extractMicrofilmImage({
      dgsNumber,
      imageIndex,
      preferHeadless: Boolean(preferHeadless),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to extract microfilm image";
    console.error("Image extraction route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
