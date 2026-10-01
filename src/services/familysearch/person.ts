import type { GedcomxDocument, GedcomxPerson } from "@/types/gedcomx";
import { familySearchFetch } from "./client";

export interface DetailedPerson {
  id: string;
  fullName: string;
  alternateNames: string[];
  gender?: string;
  birth?: {
    date?: string;
    place?: string;
  };
  christening?: {
    date?: string;
    place?: string;
  };
  marriage?: {
    date?: string;
    place?: string;
  };
  death?: {
    date?: string;
    place?: string;
  };
  raw: GedcomxPerson;
}

/**
 * Retrieves complete person details from FamilySearch Tree
 */
export async function getPersonDetails(personId: string): Promise<DetailedPerson | null> {
  const data = await familySearchFetch<GedcomxDocument>(`/platform/tree/persons/${personId}`);
  const person = data.persons?.[0];
  if (!person) {
    return null;
  }

  const primaryName = person.names?.[0]?.nameForms?.[0]?.fullText || "Unknown";
  const alternateNames =
    person.names
      ?.slice(1)
      .map((n) => n.nameForms?.[0]?.fullText)
      .filter((n): n is string => Boolean(n)) || [];

  const birth = person.facts?.find((f) => f.type.includes("Birth"));
  const christening = person.facts?.find(
    (f) => f.type.includes("Christening") || f.type.includes("Baptism"),
  );
  const marriage = person.facts?.find((f) => f.type.includes("Marriage"));
  const death = person.facts?.find((f) => f.type.includes("Death"));

  return {
    id: person.id,
    fullName: primaryName,
    alternateNames,
    gender: person.gender?.type?.split("/").pop(),
    birth: birth ? { date: birth.date?.original, place: birth.place?.original } : undefined,
    christening: christening
      ? { date: christening.date?.original, place: christening.place?.original }
      : undefined,
    marriage: marriage
      ? { date: marriage.date?.original, place: marriage.place?.original }
      : undefined,
    death: death ? { date: death.date?.original, place: death.place?.original } : undefined,
    raw: person,
  };
}

export interface PersonSourceDescription {
  id?: string;
  titles?: string[];
  citation?: string;
  url?: string;
  notes?: string;
}

/**
 * Retrieves attached sources and documents for a person from FamilySearch Tree
 */
export async function getPersonSources(personId: string): Promise<PersonSourceDescription[]> {
  try {
    const data = await familySearchFetch<{
      sourceDescriptions?: Array<{
        id?: string;
        titles?: Array<{ value?: string }>;
        citations?: Array<{ value?: string }>;
        about?: string;
        notes?: Array<{ text?: string }>;
      }>;
    }>(`/platform/tree/persons/${personId}/sources`);

    return (data.sourceDescriptions || []).map((s) => ({
      id: s.id,
      titles: s.titles?.map((t) => t.value || "").filter(Boolean) || [],
      citation: s.citations?.[0]?.value,
      url: s.about,
      notes: s.notes?.map((n) => n.text || "").join("\n"),
    }));
  } catch (error) {
    console.error(`Failed to fetch sources for person ${personId}:`, error);
    return [];
  }
}

export interface PersonRelationships {
  spouses: Array<{ id: string; name: string; gender?: string }>;
  parents: Array<{ id: string; name: string; gender?: string }>;
  children: Array<{ id: string; name: string; gender?: string }>;
}

/**
 * Retrieves spouses, parents and children of a person from FamilySearch Tree
 */
export async function getPersonRelationships(personId: string): Promise<PersonRelationships> {
  const result: PersonRelationships = {
    spouses: [],
    parents: [],
    children: [],
  };

  try {
    const [spousesData, parentsData, childrenData] = await Promise.all([
      familySearchFetch<{
        persons?: Array<{
          id: string;
          names?: Array<{ nameForms?: Array<{ fullText?: string }> }>;
          gender?: { type?: string };
        }>;
      }>(`/platform/tree/persons/${personId}/spouses`).catch(() => ({ persons: [] })),
      familySearchFetch<{
        persons?: Array<{
          id: string;
          names?: Array<{ nameForms?: Array<{ fullText?: string }> }>;
          gender?: { type?: string };
        }>;
      }>(`/platform/tree/persons/${personId}/parents`).catch(() => ({ persons: [] })),
      familySearchFetch<{
        persons?: Array<{
          id: string;
          names?: Array<{ nameForms?: Array<{ fullText?: string }> }>;
          gender?: { type?: string };
        }>;
      }>(`/platform/tree/persons/${personId}/children`).catch(() => ({ persons: [] })),
    ]);

    if (spousesData?.persons) {
      result.spouses = spousesData.persons.map((p) => ({
        id: p.id,
        name: p.names?.[0]?.nameForms?.[0]?.fullText || "Cônjuge Desconhecido",
        gender: p.gender?.type?.split("/").pop(),
      }));
    }

    if (parentsData?.persons) {
      result.parents = parentsData.persons.map((p) => ({
        id: p.id,
        name: p.names?.[0]?.nameForms?.[0]?.fullText || "Genitor Desconhecido",
        gender: p.gender?.type?.split("/").pop(),
      }));
    }

    if (childrenData?.persons) {
      result.children = childrenData.persons.map((p) => ({
        id: p.id,
        name: p.names?.[0]?.nameForms?.[0]?.fullText || "Filho(a) Desconhecido(a)",
        gender: p.gender?.type?.split("/").pop(),
      }));
    }
  } catch (err) {
    console.warn(`Could not fetch relationships for person ${personId}:`, err);
  }

  return result;
}
