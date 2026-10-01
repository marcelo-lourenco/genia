import { familySearchFetch } from "@/services/familysearch/client";
import { getSession } from "@/services/storage/session";
import { type PlaywrightScrapeResult, scrapeFamilySearchImageViewer } from "./playwright-viewer";

export interface ExtractImageOptions {
  dgsNumber: string;
  imageIndex: number;
  preferHeadless?: boolean;
}

export interface ExtractedImageResult {
  imageBase64: string;
  mimeType: string;
  source: "rest_api" | "headless_fallback";
  sourceUrl: string;
  latencyMs: number;
}

/**
 * Intelligent Fallback Manager: Attempts REST API first; if restricted by copyright or 403,
 * falls back seamlessly to Playwright headless automation.
 */
export async function extractMicrofilmImage(
  options: ExtractImageOptions,
): Promise<ExtractedImageResult> {
  const startTime = Date.now();
  const { dgsNumber, imageIndex, preferHeadless = false } = options;

  const session = await getSession();

  // If preferHeadless is false, try REST API first
  if (!preferHeadless) {
    try {
      const restPath = `/platform/records/images/${dgsNumber}/${imageIndex}`;
      const imageResponse = await familySearchFetch<string | ArrayBuffer>(restPath, {
        headers: { Accept: "image/jpeg, image/png, application/json" },
      });

      if (imageResponse instanceof ArrayBuffer) {
        const buffer = Buffer.from(imageResponse);
        return {
          imageBase64: buffer.toString("base64"),
          mimeType: "image/jpeg",
          source: "rest_api",
          sourceUrl: restPath,
          latencyMs: Date.now() - startTime,
        };
      }

      if (typeof imageResponse === "string" && imageResponse.length > 500) {
        return {
          imageBase64: imageResponse,
          mimeType: "image/jpeg",
          source: "rest_api",
          sourceUrl: restPath,
          latencyMs: Date.now() - startTime,
        };
      }
    } catch (apiError) {
      console.warn(
        `[FallbackManager] REST API extraction failed for DGS ${dgsNumber} (Image ${imageIndex}). Triggering Playwright Headless Fallback...`,
        apiError,
      );
    }
  }

  // Fallback to Playwright Headless Scraper
  const scrapeResult: PlaywrightScrapeResult = await scrapeFamilySearchImageViewer({
    dgsNumber,
    imageIndex,
    sessionCookie: session?.accessToken,
  });

  return {
    imageBase64: scrapeResult.imageBase64,
    mimeType: scrapeResult.mimeType,
    source: "headless_fallback",
    sourceUrl: scrapeResult.sourceUrl,
    latencyMs: Date.now() - startTime,
  };
}
