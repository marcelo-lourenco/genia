import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateNameProximity,
  levenshteinDistance,
  normalizeGenealogicalPhonetics,
  soundex,
  transliterateCyrillic,
} from "@/lib/phonetic";

test("transliterateCyrillic correctly converts standard and archaic characters", () => {
  // Modern Russian: Колосовский -> kolosovskiy
  assert.equal(transliterateCyrillic("Колосовский"), "kolosovskiy");

  // Archaic pre-1918 letters (ѣ, і) e.g. Бѣшгіозъ -> beshgioz
  assert.equal(transliterateCyrillic("Бѣшгіозъ"), "beshgioz");
});

test("normalizeGenealogicalPhonetics harmonizes surname suffix variations", () => {
  // Colosovschi (Romanian) and Kolosovsky (English) should normalize to identical/near-identical stems
  const normRomanian = normalizeGenealogicalPhonetics("Colosovschi");
  const normRussian = normalizeGenealogicalPhonetics("Колосовский");
  const normEnglish = normalizeGenealogicalPhonetics("Kolosovsky");

  assert.equal(normRomanian, normRussian);
  assert.equal(normRomanian, normEnglish);
});

test("soundex produces consistent genealogical codes", () => {
  assert.equal(soundex("Colosovschi"), soundex("Kolosovsky"));
  assert.equal(soundex("Terzi"), soundex("Терзи"));
});

test("levenshteinDistance computes accurate character edits", () => {
  assert.equal(levenshteinDistance("Ivan", "Iwan"), 1);
  assert.equal(levenshteinDistance("Bender", "Bender"), 0);
});

test("calculateNameProximity recognizes Bessarabian surname equivalents with high confidence", () => {
  const result = calculateNameProximity("Colosovschi", "Колосовский");

  assert.equal(result.phoneticMatch, true);
  assert.ok(result.similarity >= 0.85);
  assert.ok(result.rationale.toLowerCase().includes("proximidade"));
});

test("calculateNameProximity differentiates unrelated surnames", () => {
  const result = calculateNameProximity("Colosovschi", "Smith");

  assert.equal(result.phoneticMatch, false);
  assert.ok(result.similarity < 0.4);
});
