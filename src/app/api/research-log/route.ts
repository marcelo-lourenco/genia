import { promises as fs } from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import type { ResearchLogEntry } from "@/types/agent";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "research-log.json");

async function readLogFile(): Promise<ResearchLogEntry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Could not read research-log.json, initializing empty list", error);
    return [];
  }
}

async function writeLogFile(entries: ResearchLogEntry[]): Promise<void> {
  const dir = path.dirname(DATA_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

/**
 * GET /api/research-log - Retrieve all research log entries
 */
export async function GET() {
  try {
    const entries = await readLogFile();
    return NextResponse.json({ success: true, entries });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load research log";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/research-log - Add a new research log entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entries = await readLogFile();

    const newEntry: ResearchLogEntry = {
      id: body.id || `log-${Date.now()}`,
      timestamp: body.timestamp || new Date().toISOString().replace("T", " ").substring(0, 16),
      repository: body.repository || "FamilySearch",
      collection: body.collection || "Coleção Não Especificada",
      sourceReference: body.sourceReference || "Citação pendente",
      searchedCriteria: {
        targetName: body.searchedCriteria?.targetName || "Indivíduo Desconhecido",
        variants: body.searchedCriteria?.variants || [],
        dateRange: body.searchedCriteria?.dateRange,
        location: body.searchedCriteria?.location,
      },
      resultStatus: body.resultStatus || "verified",
      findings: body.findings || "Busca realizada.",
      confidenceScore: typeof body.confidenceScore === "number" ? body.confidenceScore : 0.9,
      notes: body.notes,
    };

    // Prepend to list so newest entries show first
    const updated = [newEntry, ...entries];
    await writeLogFile(updated);

    return NextResponse.json({ success: true, entry: newEntry, entries: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to save research log";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/research-log?id=... - Delete a log entry by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing 'id' parameter" },
        { status: 400 },
      );
    }

    const entries = await readLogFile();
    const updated = entries.filter((e) => e.id !== id);
    await writeLogFile(updated);

    return NextResponse.json({ success: true, entries: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete log entry";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
