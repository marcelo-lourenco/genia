import {
  buildCyrillicParishPrompt,
  type CyrillicTranscriptionContext,
} from "@/ai/prompts/cyrillic-19th";
import {
  buildRomanianParishPrompt,
  type RomanianTranscriptionContext,
} from "@/ai/prompts/romanian-records";
import { getGeminiClient } from "./client";

export interface AnalyzeManuscriptOptions {
  imageBase64: string;
  mimeType?: string;
  language?: string;
  context: CyrillicTranscriptionContext &
    RomanianTranscriptionContext & {
      notes?: string;
    };
  modelName?: string;
}

export interface ManuscriptAnalysisResult {
  transcription: string;
  translation?: string;
  matchFound: boolean;
  confidenceScore: number;
  extractedDetails: {
    recordType?: string;
    entryNumber?: string;
    birthDate?: string;
    baptismDate?: string;
    marriageDate?: string;
    deathDate?: string;
    childName?: string;
    fatherName?: string;
    motherName?: string;
    place?: string;
    witnesses?: string;
    official?: string;
  };
  summary: string;
}

/**
 * Sends a manuscript page image to Google Gemini Multimodal for transcription and genealogical analysis
 * Implements an automatic model cascade against transient HTTP 503 or load spikes.
 */
export async function analyzeManuscript(
  options: AnalyzeManuscriptOptions,
): Promise<ManuscriptAnalysisResult> {
  const ai = getGeminiClient();

  const candidateModels = options.modelName
    ? [options.modelName, "gemini-3.5-flash-lite", "gemini-flash-lite-latest"]
    : ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"];

  let prompt = "";
  const langLower = (options.language || "universal").toLowerCase();

  if (
    langLower.includes("cyrillic") ||
    langLower.includes("russian") ||
    langLower.includes("russo")
  ) {
    prompt = buildCyrillicParishPrompt(options.context);
  } else if (
    langLower.includes("romanian") ||
    langLower.includes("moldav") ||
    langLower.includes("romeno")
  ) {
    prompt = buildRomanianParishPrompt(options.context);
  } else {
    prompt = `Você é um especialista em Paleografia Histórica e Genealogia Documental (padrão GPS).
Analise a imagem deste fólio ou manuscrito no contexto de idioma: ${options.language || "Universal / Auto-detectar"}.

DADOS DE CONTEXTO PARA INVESTIGAÇÃO:
- Pessoa procurada: ${options.context.targetPerson || "Qualquer indivíduo relevante no assento"}
- Sobrenome: ${options.context.targetSurname || "Não especificado"}
- Data/Ano aproximado: ${options.context.year || options.context.targetDate || "Não especificado"}
- Localidade / Paróquia / Cartório: ${options.context.villageName || "Não especificado"}

INSTRUÇÕES PALEOGRÁFICAS E PROBATÓRIAS:
1. Transcreva com fidelidade diplomática o texto original do assento/fólio.
2. Forneça uma TRADUÇÃO/VERSÃO em Português Moderno legível (especialmente se o original for latim, cirílico, italiano arcaico, alemão ou romeno).
3. Extraia as entidades genealógicas: Tipo de registro (Batismo/Nascimento, Matrimônio, Óbito), Nomes dos envolvidos, Filiação completa, Datas citadas, Localidade e Testemunhas/Padrinhos.
4. Avalie se a pessoa procurada foi encontrada e determine o grau de confiança probatória (0% a 100%).
5. Elabore um resumo objetivo para fundamentação no Diário de Pesquisa Genealógica.

FORMATO ESTRITO DE RESPOSTA:
CORRESPONDENCIA_ENCONTRADA: [Sim ou Não]
CONFIANCA: [X]%
TIPO_REGISTRO: [Batismo, Casamento, Óbito, etc.]
DATA_FATO: [Data identificada]
LOCAL_FATO: [Localidade identificada]
FILIACAO: [Pai: ..., Mãe: ...]
TESTEMUNHAS_PADRINHOS: [Nomes citados]
OFICIAL_CELEBRANTE: [Vigário ou Escrivão]
TRANSCRICAO_ORIGINAL:
[Texto diplomático original]
TRADUCAO_PORTUGUES:
[Texto em português moderno e legível]
RESUMO_GPS:
[Resumo sintético para o Diário de Pesquisa]`;
  }

  const cleanBase64 = options.imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const mimeType = options.mimeType || "image/jpeg";

  let lastError: unknown = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
      });

      const text = response.text || "";

      // Parse fields from structured response
      const matchFound =
        text.includes("CORRESPONDENCIA_ENCONTRADA: Sim") ||
        text.includes("CORRESPONDÊNCIA_ENCONTRADA: Sim") ||
        text.toLowerCase().includes("correspondência encontrada: sim") ||
        (text.toLowerCase().includes("encontrado") &&
          !text.toLowerCase().includes("não encontrado"));

      let confidenceScore = 0.85;
      const confidenceMatch = text.match(/CONFIAN[CÇ]A:\s*(\d+)%/i);
      if (confidenceMatch) {
        confidenceScore = Number.parseInt(confidenceMatch[1], 10) / 100;
      }

      // Extract sections
      let transcription = text;
      let translation: string | undefined;
      let summary = "";

      const transMatch = text.match(/TRANSCRICAO_ORIGINAL:\s*([\s\S]*?)(?=TRADUCAO_PORTUGUES:|$)/i);
      if (transMatch) {
        transcription = transMatch[1].trim();
      }

      const tradMatch = text.match(/TRADUCAO_PORTUGUES:\s*([\s\S]*?)(?=RESUMO_GPS:|$)/i);
      if (tradMatch) {
        translation = tradMatch[1].trim();
      }

      const resMatch = text.match(/RESUMO_GPS:\s*([\s\S]*?)$/i);
      if (resMatch) {
        summary = resMatch[1].trim();
      } else {
        summary = text.slice(0, 320);
      }

      // Extract details
      const recordTypeMatch = text.match(/TIPO_REGISTRO:\s*([^\n\r]+)/i);
      const dateMatch = text.match(/DATA_FATO:\s*([^\n\r]+)/i);
      const placeMatch = text.match(/LOCAL_FATO:\s*([^\n\r]+)/i);
      const witnessesMatch = text.match(/TESTEMUNHAS_PADRINHOS:\s*([^\n\r]+)/i);
      const officialMatch = text.match(/OFICIAL_CELEBRANTE:\s*([^\n\r]+)/i);

      return {
        transcription,
        translation,
        matchFound,
        confidenceScore,
        extractedDetails: {
          recordType: recordTypeMatch?.[1]?.trim(),
          birthDate: dateMatch?.[1]?.trim() || options.context.targetDate,
          childName: options.context.targetPerson,
          fatherName: options.context.targetFather,
          motherName: options.context.targetMother,
          place: placeMatch?.[1]?.trim() || options.context.villageName,
          witnesses: witnessesMatch?.[1]?.trim(),
          official: officialMatch?.[1]?.trim(),
        },
        summary,
      };
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[analyzeManuscript] Modelo ${model} falhou: ${errMsg}. Tentando próximo modelo...`,
      );
    }
  }

  throw new Error(
    `Falha em todos os modelos paleográficos: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}
