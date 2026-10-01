/**
 * Agent Status and Genealogical Proof Standard (GPS) Research Log Types
 */

export type ResearchStatus = "pending" | "in_progress" | "verified" | "negative" | "conflict";

export interface ResearchLogEntry {
  id: string;
  timestamp: string;
  repository: string;
  collection: string;
  sourceReference: string; // e.g. "DGS 005610797, Item 2, Delo 445"
  searchedCriteria: {
    targetName: string;
    variants: string[];
    dateRange?: string;
    location?: string;
  };
  resultStatus: ResearchStatus;
  findings: string;
  confidenceScore: number; // 0.0 to 1.0
  notes?: string;
}

export interface TreeAuditGap {
  personId: string;
  personName: string;
  missingData: Array<"birthDate" | "birthPlace" | "father" | "mother" | "sources">;
  suggestedAction: string;
}
