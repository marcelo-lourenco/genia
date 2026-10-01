import { type NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/ai/gemini/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rootPersonName, totalAncestors, generations, gaps } = body;

    const ai = getGeminiClient();

    const prompt = `Você é um Genealogista Profissional Sênior e Especialista em Auditoria de Árvores do FamilySearch, credenciado pelo Genealogical Proof Standard (GPS).

Analise o seguinte estado da árvore genealógica e suas lacunas detectadas:
- Pessoa Raiz / Foco: ${rootPersonName || "Indivíduo Selecionado"}
- Total de Ancestrais Localizados: ${totalAncestors || 0}
- Gerações Exploradas: ${generations || 4}

LACUNAS DETECTADAS NA LINHAGEM:
${JSON.stringify(gaps, null, 2)}

INSTRUÇÕES PARA O DIAGNÓSTICO:
1. Resuma objetivamente a saúde genealógica desta linhagem (grau de completude e pontos críticos).
2. Para cada ancestral com lacuna, proponha uma estratégia prática de investigação:
   - Quais registros (paroquiais, civis, censitários, militares, passaportes ou inventários) devem ser prioritários.
   - Variações ortográficas prováveis e contexto histórico do período.
   - Onde buscar no FamilySearch (Registros Históricos indexados vs. Microfilmes DGS não indexados).
3. Conclua com um plano de ação prioritário em 3 passos para o usuário seguir agora.

Mantenha o tom profissional, encorajador, estruturado com tópicos em Markdown e focado em evidências reais.`;

    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
    ];

    let diagnosis = "";
    let lastError: unknown = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        if (response.text) {
          diagnosis = response.text;
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        console.warn(
          `[Gemini Diagnosis] Model ${model} unavailable or busy, trying next fallback...`,
        );
      }
    }

    if (!diagnosis) {
      throw lastError || new Error("Todos os modelos de IA estão temporariamente indisponíveis.");
    }

    return NextResponse.json({
      success: true,
      diagnosis,
    });
  } catch (error: unknown) {
    console.error("Tree audit AI diagnosis error:", error);
    const message = error instanceof Error ? error.message : "Erro ao processar diagnóstico";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
