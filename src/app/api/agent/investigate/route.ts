import { promises as fs } from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/ai/gemini/client";
import type { ResearchLogEntry } from "@/types/agent";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "research-log.json");

async function appendToResearchLog(entry: ResearchLogEntry): Promise<void> {
  let entries: ResearchLogEntry[] = [];
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    entries = JSON.parse(raw);
  } catch {
    entries = [];
  }

  const updated = [entry, ...entries];
  const dir = path.dirname(DATA_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personId, personName, missingData = [], suggestedAction = "", rootPersonName } = body;

    if (!personName) {
      return NextResponse.json(
        { success: false, error: "Nome da pessoa é obrigatório para investigação." },
        { status: 400 },
      );
    }

    const ai = getGeminiClient();

    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
    ];

    const prompt = `Você é o Agente Autônomo de Investigação Genealógica do GENIA, especializado no Genealogical Proof Standard (GPS).
Você foi incumbido de investigar e resolver uma LACUNA identificada na árvore genealógica de um usuário.

DADOS DA PESSOA ALVO:
- Nome Completo: ${personName}
- Identificador FamilySearch: ${personId || "N/D"}
- Linha Ascendente / Raiz da Árvore: ${rootPersonName || "Árvore do Usuário"}
- Lacunas Detectadas (Campos Ausentes): ${missingData.join(", ") || "Dados biográficos incompletos"}
- Ação Preliminar Sugerida: ${suggestedAction || "Localizar certidão ou assento paroquial"}

OBJETIVOS DA INVESTIGAÇÃO:
1. Formular hipóteses genealógicas probatórias fundamentadas para superar essa lacuna.
2. Identificar exatamente quais acervos e repositórios devem ser consultados (ex: Paróquias Eclesiásticas caso anterior a 1889 no Brasil; Cartórios do Registro Civil pós-1889; Registros de Imigração e Hospedarias; Arquivos Distritais se origem portuguesa; Stato Civile se italiana; etc.).
3. Especificar variações de grafia e nomes com os quais o indivíduo pode estar indexado.
4. Fornecer um roteiro de 3 passos de alta probabilidade para obter a certidão/assento original.
5. Elaborar uma conclusão probatória conforme o GPS.

FORMATO ESTRITO DE RESPOSTA EM JSON (sem formatação markdown envolvente):
{
  "hypothesis": "Hipótese genealógica formulada...",
  "primaryRepositories": ["Repositório 1...", "Repositório 2..."],
  "spellingVariants": ["Variante 1", "Variante 2"],
  "actionSteps": [
    "Passo 1: ...",
    "Passo 2: ...",
    "Passo 3: ..."
  ],
  "gpsProofSummary": "Síntese probatória para fundamentar a certidão no padrão GPS...",
  "confidenceScore": 0.85
}`;

    let lastError: unknown = null;
    let parsedResult = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          config: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = response.text || "{}";
        parsedResult = JSON.parse(text);
        break;
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[investigate] Modelo ${model} falhou: ${errMsg}. Tentando próximo...`);
      }
    }

    if (!parsedResult) {
      throw new Error(
        `Falha ao executar investigação com os modelos de IA: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
      );
    }

    // Auto-create research log entry in the GPS Research Journal
    const entryId = `inv-${Date.now()}`;
    const logEntry: ResearchLogEntry = {
      id: entryId,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      repository: parsedResult.primaryRepositories?.[0] || "Registro Civil / Paróquias Históricas",
      collection: `Investigação Autônoma de Lacuna: ${missingData.join(", ")}`,
      sourceReference: `Auditoria Genealógica ID ${personId || "Tree"} - Parecer GPS do Agente`,
      searchedCriteria: {
        targetName: personName,
        variants: parsedResult.spellingVariants || [],
        dateRange: "Período estimado pelo agente",
        location: "Comarca / Paróquia Provável",
      },
      resultStatus: "verified",
      findings: parsedResult.gpsProofSummary || "Plano probatório formulado pelo Agente.",
      confidenceScore: parsedResult.confidenceScore || 0.85,
      notes: `Hipótese Probatória:\n${parsedResult.hypothesis}\n\nRepositórios Recomendados:\n- ${parsedResult.primaryRepositories?.join("\n- ")}\n\nRoteiro de Resolução:\n1. ${parsedResult.actionSteps?.join("\n2. ")}`,
    };

    await appendToResearchLog(logEntry);

    return NextResponse.json({
      success: true,
      data: {
        personId,
        personName,
        hypothesis: parsedResult.hypothesis,
        primaryRepositories: parsedResult.primaryRepositories,
        spellingVariants: parsedResult.spellingVariants,
        actionSteps: parsedResult.actionSteps,
        gpsProofSummary: parsedResult.gpsProofSummary,
        confidenceScore: parsedResult.confidenceScore,
        logEntryId: entryId,
      },
    });
  } catch (error: unknown) {
    console.error("Investigation API error:", error);
    const msg = error instanceof Error ? error.message : "Erro na investigação autônoma";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
