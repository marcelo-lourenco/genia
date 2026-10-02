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

export interface PersonMatchCandidate {
  id?: string;
  title?: string;
  link?: string;
}

/**
 * Retrieves prospective record matches / record hints for a person
 * (sources or tree records suggested by FamilySearch that are NOT YET attached)
 */
export async function getPersonMatches(personId: string): Promise<PersonMatchCandidate[]> {
  try {
    const data = await familySearchFetch<{
      entries?: Array<{
        id?: string;
        title?: string;
        links?: Record<string, { href?: string }>;
      }>;
    }>(`/platform/tree/persons/${personId}/matches`, {
      headers: { Accept: "application/x-gedcomx-atom+json, application/json" },
    });

    return (data.entries || []).map((e) => ({
      id: e.id,
      title: e.title,
      link: e.links?.person?.href || e.links?.self?.href,
    }));
  } catch (_err) {
    return [];
  }
}

export interface PersonaRecordDetails {
  id: string;
  names: string[];
  facts: Array<{ type: string; date?: string; place?: string }>;
  certificateNumber?: string;
  filmNumber?: string;
  imageNumber?: string;
  imageArk?: string;
}

/**
 * Inspeciona profundamente o registro civil, assento paroquial ou cartão de imigração subjacente
 * a partir do ID do persona no FamilySearch, extraindo número do termo, microfilme DGS, fólio e fatos.
 */
export async function getPersonaRecordDetails(
  personaId: string,
): Promise<PersonaRecordDetails | null> {
  try {
    const cleanId = personaId.replace(/.*[:/]/, "").trim();
    if (!cleanId) return null;

    const res = await familySearchFetch<{
      persons?: Array<{
        display?: { name?: string; gender?: string };
        facts?: Array<{
          type?: string;
          date?: { original?: string };
          place?: { original?: string };
        }>;
      }>;
      fields?: Array<{
        id?: string;
        type?: string;
        values?: Array<{ labelId?: string; text?: string }>;
      }>;
      sourceDescriptions?: Array<{
        about?: string;
      }>;
    }>(`/platform/records/personas/${cleanId}`, {
      headers: { Accept: "application/x-gedcomx-atom+json, application/json" },
    });

    if (!res?.persons?.length) return null;

    const names = res.persons.map((p) => p.display?.name || "").filter(Boolean);
    const facts = (res.persons[0]?.facts || []).map((f) => ({
      type: f.type?.split("/").pop() || "Evento",
      date: f.date?.original,
      place: f.place?.original,
    }));

    let certificateNumber: string | undefined;
    let filmNumber: string | undefined;
    let imageNumber: string | undefined;

    for (const field of res.fields || []) {
      for (const val of field.values || []) {
        if (
          val.labelId?.includes("CERTIFICATE") ||
          val.labelId?.includes("ENTRY_NBR") ||
          val.labelId?.includes("TERMO")
        ) {
          certificateNumber = val.text;
        }
        if (val.labelId?.includes("DIGITAL_FILM_NBR") || val.labelId?.includes("FILM")) {
          filmNumber = val.text;
        }
        if (val.labelId?.includes("IMAGE_NBR") || val.labelId?.includes("PAGE")) {
          imageNumber = val.text;
        }
      }
    }

    const imageArk = res.sourceDescriptions?.find((sd) => sd.about?.includes("3:1:"))?.about;

    return {
      id: cleanId,
      names,
      facts,
      certificateNumber,
      filmNumber,
      imageNumber,
      imageArk,
    };
  } catch (_err) {
    return null;
  }
}
