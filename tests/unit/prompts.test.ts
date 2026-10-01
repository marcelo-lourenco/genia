import assert from "node:assert/strict";
import test from "node:test";
import { buildCyrillicParishPrompt } from "@/ai/prompts/cyrillic-19th";
import { buildReconciliationPrompt } from "@/ai/prompts/reconciliation";
import { buildRomanianParishPrompt } from "@/ai/prompts/romanian-records";

test("buildCyrillicParishPrompt injects context and paleographic rules", () => {
  const prompt = buildCyrillicParishPrompt({
    villageName: "Beșghioz",
    year: "1909",
    targetPerson: "Иван",
    targetSurname: "Колосовский",
    targetDate: "18/10/1909",
  });

  assert.ok(prompt.includes("Beșghioz"));
  assert.ok(prompt.includes("1909"));
  assert.ok(prompt.includes("Иван"));
  assert.ok(prompt.includes("Колосовский"));
  assert.ok(prompt.includes("18/10/1909"));
  assert.ok(prompt.includes("ѣ (Yat)"), "Includes archaic orthography guide");
  assert.ok(prompt.includes("CORRESPONDÊNCIA_ENCONTRADA"));
});

test("buildRomanianParishPrompt injects context and diacritic rules", () => {
  const prompt = buildRomanianParishPrompt({
    location: "Bessarábia",
    targetPerson: "Ion",
    targetSurname: "Colosovschi",
  });

  assert.ok(prompt.includes("Bessarábia"));
  assert.ok(prompt.includes("Colosovschi"));
  assert.ok(prompt.includes("Genealogical Proof Standard"));
});

test("buildReconciliationPrompt requests structured JSON comparison", () => {
  const prompt = buildReconciliationPrompt({
    claimedPerson: {
      givenName: "Iwan",
      surname: "Colosovschi",
      birthDate: "18/10/1909",
      birthPlace: "Beșghioz",
      fatherName: "Harlampe",
      motherName: "Maria Terzi",
    },
    candidateRecord: {
      extractedName: "Иван",
      extractedSurname: "Колосовский",
      extractedDate: "05/10/1909 (Juliano)",
      extractedFather: "Харлампий",
      extractedMother: "Мария",
      sourceDocument: "Fundo 211, Opis 2, Delo 476, Beșghioz",
    },
  });

  assert.ok(prompt.includes("Iwan Colosovschi"));
  assert.ok(prompt.includes("Иван Колосовский"));
  assert.ok(prompt.includes("julian_gregorian_shift"), "Accounts for Julian/Gregorian shift");
  assert.ok(prompt.includes("confidenceScore"));
});
