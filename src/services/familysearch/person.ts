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
