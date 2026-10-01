import assert from "node:assert/strict";
import test from "node:test";
import { searchFormSchema } from "@/lib/validations/search";

test("searchFormSchema accepts valid genealogical inputs", () => {
  const result = searchFormSchema.safeParse({
    givenName: "Iwan",
    surname: "Colosovschi",
    birthDate: "18/10/1909",
    birthPlace: "Beșghioz",
    fatherGivenName: "Harlampe",
    motherGivenName: "Maria",
    dgsNumber: "005610797",
    language: "cyrillic_russian",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.surname, "Colosovschi");
    assert.equal(result.data.language, "cyrillic_russian");
  }
});

test("searchFormSchema rejects empty or too short surname", () => {
  const result = searchFormSchema.safeParse({
    surname: "C",
  });

  assert.equal(result.success, false);
});

test("searchFormSchema defaults language to cyrillic_russian", () => {
  const result = searchFormSchema.safeParse({
    surname: "Terzi",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.language, "cyrillic_russian");
  }
});

test("normalizeSearchDate converts DD/MM/YYYY and extracts years", async () => {
  const { normalizeSearchDate } = await import("@/services/familysearch/search");

  assert.equal(normalizeSearchDate("21/02/1901"), "1901-02-21");
  assert.equal(normalizeSearchDate("18/10/1909"), "1909-10-18");
  assert.equal(normalizeSearchDate("1901"), "1901");
  assert.equal(normalizeSearchDate("c. 1905"), "1905");
  assert.equal(normalizeSearchDate(undefined), undefined);
});
