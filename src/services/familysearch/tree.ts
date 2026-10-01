import type { TreeAuditGap } from "@/types/agent";
import type { GedcomxDocument, GedcomxPerson } from "@/types/gedcomx";
import { FamilySearchApiError, familySearchFetch } from "./client";

export interface AncestryNode {
  id: string;
  ahnenNumber: number; // 1 = root, 2 = father, 3 = mother, etc. -1 = spouse
  ascendancyNumber?: string;
  name: string;
  gender?: string;
  lifespan?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  fatherId?: string;
  motherId?: string;
}

export interface TreeAncestryAuditResult {
  rootPersonId: string;
  totalAncestorsFound: number;
  generationsExplored: number;
  ancestors: AncestryNode[];
  gaps: TreeAuditGap[];
}

/**
 * Explores ancestry tree up to specified generations and identifies missing links / facts
 */
export async function getTreeAncestors(
  personId: string,
  generations = 4,
): Promise<TreeAncestryAuditResult> {
  let data: GedcomxDocument;
  try {
    data = await familySearchFetch<GedcomxDocument>(
      `/platform/tree/ancestry?person=${personId}&generations=${generations}`,
    );
  } catch (error) {
    if (error instanceof FamilySearchApiError && error.status === 410) {
      throw new Error(
        `O identificador "${personId}" não é uma pessoa válida na Árvore Familiar ou foi excluído/mesclado no FamilySearch (HTTP 410 Gone).`,
      );
    }
    throw error;
  }

  const personsMap = new Map<string, GedcomxPerson>();
  if (data.persons) {
    for (const p of data.persons) {
      personsMap.set(p.id, p);
    }
  }

  const ancestors: AncestryNode[] = [];
  const gaps: TreeAuditGap[] = [];

  // Parse each person in the ancestry response
  for (const [id, person] of personsMap.entries()) {
    const primaryName =
      person.display?.name || person.names?.[0]?.nameForms?.[0]?.fullText || "Indivíduo";
    const birthFact = person.facts?.find((f) => f.type.includes("Birth"));
    const deathFact = person.facts?.find((f) => f.type.includes("Death"));
    const birthDate = person.display?.birthDate || birthFact?.date?.original;
    const birthPlace = person.display?.birthPlace || birthFact?.place?.original;
    const deathDate = person.display?.deathDate || deathFact?.date?.original;
    const deathPlace = person.display?.deathPlace || deathFact?.place?.original;

    const ascendancyNumber = person.display?.ascendancyNumber || (id === personId ? "1" : "0");
    const ahnenNumber =
      ascendancyNumber === "1-S"
        ? -1
        : Number.parseInt(ascendancyNumber, 10) || (id === personId ? 1 : 0);

    const missingData: Array<"birthDate" | "birthPlace" | "father" | "mother" | "sources"> = [];
    if (!birthDate) {
      missingData.push("birthDate");
    }
    if (!birthPlace) {
      missingData.push("birthPlace");
    }
    if (!person.sources || person.sources.length === 0) {
      missingData.push("sources");
    }

    ancestors.push({
      id,
      ahnenNumber,
      ascendancyNumber,
      name: primaryName,
      gender: person.display?.gender || person.gender?.type?.split("/").pop(),
      lifespan:
        person.display?.lifespan ||
        (birthDate || deathDate ? `${birthDate || "?"}–${deathDate || "?"}` : undefined),
      birthDate,
      birthPlace,
      deathDate,
      deathPlace,
    });

    if (missingData.length > 0) {
      gaps.push({
        personId: id,
        personName: primaryName,
        missingData,
        suggestedAction: `Buscar registros paroquiais ou civis para preencher: ${missingData.join(", ")}`,
      });
    }
  }

  return {
    rootPersonId: personId,
    totalAncestorsFound: ancestors.length,
    generationsExplored: generations,
    ancestors,
    gaps,
  };
}
