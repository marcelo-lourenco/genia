import assert from "node:assert/strict";
import test from "node:test";
import type {
  ExtractedImageResult,
  ExtractImageOptions,
} from "@/services/scraper/fallback-manager";

test("ExtractedImageResult interface matches expected contract", () => {
  const mockResult: ExtractedImageResult = {
    imageBase64: "dGVzdC1pbWFnZS1kYXRh",
    mimeType: "image/jpeg",
    source: "headless_fallback",
    sourceUrl: "https://www.familysearch.org/ark:/61903/3:1:005610797_00350",
    latencyMs: 1250,
  };

  assert.equal(mockResult.source, "headless_fallback");
  assert.equal(mockResult.mimeType, "image/jpeg");
  assert.ok(mockResult.imageBase64.length > 0);
  assert.ok(mockResult.latencyMs > 0);
});

test("ExtractImageOptions schema properly structures DGS parameters", () => {
  const options: ExtractImageOptions = {
    dgsNumber: "005610797",
    imageIndex: 350,
    preferHeadless: true,
  };

  assert.equal(options.dgsNumber, "005610797");
  assert.equal(options.imageIndex, 350);
  assert.equal(options.preferHeadless, true);
});
