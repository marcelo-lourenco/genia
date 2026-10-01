import type { TreeAuditGap } from "@/types/agent";
import type { GedcomxDocument, GedcomxPerson } from "@/types/gedcomx";
import { familySearchFetch } from "./client";

export interface AncestryNode {
  id: string;
  ahnenNumber: number; // 1 = root, 2 = father, 3 = mother, 4 = paternal grandfather, etc.
  name: string;
  gender?: string;
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
  const data = await familySearchFetch<GedcomxDocument>(
    `/platform/tree/ancestry?person=${personId}&generations=${generations}`,
  );

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
    const primaryName = person.names?.[0]?.nameForms?.[0]?.fullText || "Indivíduo Desconhecido";
    const birthFact = person.facts?.find((f) => f.type.includes("Birth"));
    const deathFact = person.facts?.find((f) => f.type.includes("Death"));

    const missingData: Array<"birthDate" | "birthPlace" | "father" | "mother" | "sources"> = [];
    if (!birthFact?.date?.original) {
      missingData.push("birthDate");
    }
    if (!birthFact?.place?.original) {
      missingData.push("birthPlace");
    }
    if (!person.sources || person.sources.length === 0) {
      missingData.push("sources");
    }

    ancestors.push({
      id,
      ahnenNumber: id === personId ? 1 : 0, // Assigned sequentially or via relationships
      name: primaryName,
      gender: person.gender?.type?.split("/").pop(),
      birthDate: birthFact?.date?.original,
      birthPlace: birthFact?.place?.original,
      deathDate: deathFact?.date?.original,
      deathPlace: deathFact?.place?.original,
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
