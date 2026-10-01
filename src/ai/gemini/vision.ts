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
  matchFound: boolean;
  confidenceScore: number;
  extractedDetails: {
    entryNumber?: string;
    birthDate?: string;
    baptismDate?: string;
    childName?: string;
    fatherName?: string;
    motherName?: string;
    godparents?: string;
  };
  summary: string;
}

/**
 * Sends a manuscript page image to Google Gemini Multimodal for transcription and genealogical analysis
 */
export async function analyzeManuscript(
  options: AnalyzeManuscriptOptions,
): Promise<ManuscriptAnalysisResult> {
  const ai = getGeminiClient();
  const model = options.modelName || "gemini-3.5-flash";

  let prompt = "";
  const langLower = (options.language || "general").toLowerCase();

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
    prompt = `Você é um especialista em Paleografia Histórica e Genealogia.
Analise a imagem deste fólio ou documento genealógico no idioma/contexto: ${options.language || "Universal / Auto-detectar"}.

DADOS DE CONTEXTO PARA BUSCA:
- Pessoa procurada: ${options.context.targetPerson || "Qualquer indivíduo relevante"}
- Sobrenome: ${options.context.targetSurname || "Não especificado"}
- Data/Ano aproximado: ${options.context.year || options.context.targetDate || "Qualquer ano"}
- Localidade / Paróquia / Cartório: ${options.context.villageName || "Não especificado"}

INSTRUÇÕES:
1. Transcreva com máxima precisão o texto relevante visível no documento.
2. Identifique os dados genealógicos essenciais: Nomes completos, filiação (pai e mãe), datas (nascimento, batismo, casamento ou óbito), testemunhas/padrinhos e oficial que lavrou o assento.
3. Indique se o indivíduo procurado foi localizado na imagem.
4. Forneça uma estimativa de confiança probatória (0 a 100%) conforme o padrão GPS (Genealogical Proof Standard).
5. Escreva um resumo analítico claro com as evidências extraídas.

FORMATO DE RESPOSTA OBRIGATÓRIO:
CORRESPONDÊNCIA_ENCONTRADA: [Sim/Não]
CONFIANÇA: [X]%
TRANSCRIÇÃO:
[Texto transcrito]
RESUMO_GENEALÓGICO:
[Resumo dos fatos e evidências extraídas]`;
  }

  const cleanBase64 = options.imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const mimeType = options.mimeType || "image/jpeg";

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

    // Parse confidence and match from response
    const matchFound =
      text.includes("CORRESPONDÊNCIA_ENCONTRADA: Sim") || text.toLowerCase().includes("encontrado");
    let confidenceScore = 0.5;
    const confidenceMatch = text.match(/Confiança.*?(\d+)%/i);
    if (confidenceMatch) {
      confidenceScore = Number.parseInt(confidenceMatch[1], 10) / 100;
    }

    return {
      transcription: text,
      matchFound,
      confidenceScore,
      extractedDetails: {
        childName: options.context.targetPerson,
        fatherName: options.context.targetFather,
        motherName: options.context.targetMother,
      },
      summary: `${text.slice(0, 300)}...`,
    };
  } catch (error) {
    console.error("Gemini Vision transcription failed:", error);
    throw new Error(`Erro na análise visual do Gemini: ${error}`);
  }
}
