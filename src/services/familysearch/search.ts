import type { GedcomxDocument, GedcomxPerson } from "@/types/gedcomx";
import { familySearchFetch } from "./client";

export interface SearchPersonsParams {
  givenName?: string;
  surname: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  marriageDate?: string;
  marriagePlace?: string;
  deathDate?: string;
  deathPlace?: string;
  fatherGivenName?: string;
  fatherSurname?: string;
  motherGivenName?: string;
  motherSurname?: string;
  spouseGivenName?: string;
  spouseSurname?: string;
  count?: number;
}

export interface SearchResultPerson {
  id: string;
  confidence: number;
  fullName: string;
  givenName?: string;
  surname?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  parents?: string[];
  spouse?: string;
  raw: GedcomxPerson;
}

interface GedcomxSearchResponse extends GedcomxDocument {
  entries?: Array<{
    id?: string;
    confidence?: number;
    score?: number;
    title?: string;
    content?: {
      gedcomx?: GedcomxDocument;
    };
  }>;
}

/**
 * Normalizes user-input dates (e.g. "21/02/1901" -> "1901-02-21")
 * to ISO or year format accepted by FamilySearch Tree Search API
 */
export function normalizeSearchDate(rawDate?: string): string | undefined {
  if (!rawDate) return undefined;
  const trimmed = rawDate.trim();

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Exact 4-digit Year
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Extract 4-digit year from descriptive strings (e.g. "outubro 1909" or "c. 1909")
  const extractedYear = trimmed.match(/\b(1[6789]\d{2}|20\d{2})\b/);
  if (extractedYear) {
    return extractedYear[1];
  }

  return trimmed;
}

/**
 * Searches the FamilySearch Family Tree for matching individuals using modern q.<field> parameters
 */
export async function searchPersons(params: SearchPersonsParams): Promise<SearchResultPerson[]> {
  const searchParams = new URLSearchParams();

  if (params.surname) {
    searchParams.set("q.surname", params.surname.trim());
  }
  if (params.givenName) {
    searchParams.set("q.givenName", params.givenName.trim());
  }
  if (params.gender) {
    searchParams.set("q.gender", params.gender.trim());
  }

  const normalizedBirthDate = normalizeSearchDate(params.birthDate);
  if (normalizedBirthDate) {
    searchParams.set("q.birthDate", normalizedBirthDate);
  }
  if (params.birthPlace) {
    searchParams.set("q.birthPlace", params.birthPlace.trim());
  }

  const normalizedMarriageDate = normalizeSearchDate(params.marriageDate);
  if (normalizedMarriageDate) {
    searchParams.set("q.marriageDate", normalizedMarriageDate);
  }
  if (params.marriagePlace) {
    searchParams.set("q.marriagePlace", params.marriagePlace.trim());
  }

  const normalizedDeathDate = normalizeSearchDate(params.deathDate);
  if (normalizedDeathDate) {
    searchParams.set("q.deathDate", normalizedDeathDate);
  }
  if (params.deathPlace) {
    searchParams.set("q.deathPlace", params.deathPlace.trim());
  }

  if (params.fatherGivenName) {
    searchParams.set("q.fatherGivenName", params.fatherGivenName.trim());
  }
  if (params.fatherSurname) {
    searchParams.set("q.fatherSurname", params.fatherSurname.trim());
  }
  if (params.motherGivenName) {
    searchParams.set("q.motherGivenName", params.motherGivenName.trim());
  }
  if (params.motherSurname) {
    searchParams.set("q.motherSurname", params.motherSurname.trim());
  }
  if (params.spouseGivenName) {
    searchParams.set("q.spouseGivenName", params.spouseGivenName.trim());
  }
  if (params.spouseSurname) {
    searchParams.set("q.spouseSurname", params.spouseSurname.trim());
  }

  const count = params.count || 20;
  searchParams.set("count", String(count));

  const path = `/platform/tree/search?${searchParams.toString()}`;

  const response = await familySearchFetch<GedcomxSearchResponse>(path, {
    headers: {
      Accept: "application/json, application/x-gedcomx-atom+json",
    },
  });

  const results: SearchResultPerson[] = [];

  // Extract from search entries
  if (response.entries && Array.isArray(response.entries)) {
    for (const entry of response.entries) {
      const persons = entry.content?.gedcomx?.persons || [];
      const person = persons.find((p) => p.id === entry.id) || persons[0];
      if (!person) continue;

      const primaryName = person.names?.[0]?.nameForms?.[0];
      const fallbackTitle = entry.title?.replace(/^Person [A-Z0-9-]+ \((.*)\)$/, "$1");
      const fullName =
        person.display?.name ||
        primaryName?.fullText ||
        fallbackTitle ||
        `${params.givenName || ""} ${params.surname}`.trim();

      const birthFact = person.facts?.find((f) => f.type?.includes("Birth"));
      const deathFact = person.facts?.find((f) => f.type?.includes("Death"));

      const confidence =
        entry.confidence !== undefined
          ? entry.confidence / 5
          : entry.score !== undefined
            ? Math.min(1.0, entry.score / 5)
            : 0.8;

      results.push({
        id: entry.id || person.id,
        confidence: Math.round(confidence * 100) / 100,
        fullName,
        givenName:
          primaryName?.parts?.find((p) => p.type?.includes("Given"))?.value ||
          person.display?.name?.split(" ")[0],
        surname:
          primaryName?.parts?.find((p) => p.type?.includes("Surname"))?.value ||
          person.display?.name?.split(" ").slice(1).join(" "),
        gender: person.gender?.type?.split("/").pop() || person.display?.gender,
        birthDate: person.display?.birthDate || birthFact?.date?.original,
        birthPlace: person.display?.birthPlace || birthFact?.place?.original,
        deathDate: person.display?.deathDate || deathFact?.date?.original,
        deathPlace: person.display?.deathPlace || deathFact?.place?.original,
        raw: person,
      });
    }
  }

  // Fallback if returned directly in persons array
  if (results.length === 0 && response.persons && Array.isArray(response.persons)) {
    for (const person of response.persons) {
      const primaryName = person.names?.[0]?.nameForms?.[0];
      const birthFact = person.facts?.find((f) => f.type?.includes("Birth"));
      const deathFact = person.facts?.find((f) => f.type?.includes("Death"));

      results.push({
        id: person.id,
        confidence: 0.5,
        fullName: person.display?.name || primaryName?.fullText || "Pessoa não identificada",
        gender: person.gender?.type?.split("/").pop() || person.display?.gender,
        birthDate: person.display?.birthDate || birthFact?.date?.original,
        birthPlace: person.display?.birthPlace || birthFact?.place?.original,
        deathDate: person.display?.deathDate || deathFact?.date?.original,
        deathPlace: person.display?.deathPlace || deathFact?.place?.original,
        raw: person,
      });
    }
  }

  return results;
}
