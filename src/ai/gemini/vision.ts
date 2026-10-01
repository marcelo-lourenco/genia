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
  language: "cyrillic_russian" | "romanian" | "general";
  context: CyrillicTranscriptionContext & RomanianTranscriptionContext;
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
  const model = options.modelName || "gemini-2.5-flash";

  let prompt = "";
  if (options.language === "cyrillic_russian") {
    prompt = buildCyrillicParishPrompt(options.context);
  } else if (options.language === "romanian") {
    prompt = buildRomanianParishPrompt(options.context);
  } else {
    prompt = `Transcreva e analise esta página de registro histórico para identificar indivíduos, datas e filiação.`;
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
