import { type NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/ai/gemini/client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  currentPath?: string;
  personId?: string;
  personName?: string;
  totalAncestors?: number;
  generations?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = body.messages || [];
    const context: ChatContext = body.context || {};

    if (messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhuma mensagem enviada." },
        { status: 400 },
      );
    }

    const ai = getGeminiClient();

    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
    ];

    const systemInstruction = `Você é o GENIA Copilot, um Assistente Especialista em Genealogia Científica, História Documental e Padrão de Prova Genealógica (GPS - Genealogical Proof Standard).

SEU PAPEL:
1. Auxiliar o usuário em pesquisas de ancestrais, decifração de documentos antigos, busca em cartórios civis e paróquias e superação de "muralhas" (brick walls) na árvore.
2. Fornecer orientações práticas sobre acervos (FamilySearch, Arquivo Nacional, Arquivos Distritais de Portugal, Archivio di Stato da Itália, paróquias, registros civis brasileiros, etc.).
3. Explicar como localizar livros de batismo, casamento e óbito, interpretar numerações de microfilmes (DGS) e formular hipóteses metodológicas sólidas.
4. Responda em Português do Brasil com tom profissional, encorajador, estruturado e didático. Use markdown, tópicos e destaques onde apropriado.

CONTEXTO ATUAL DA NAVEGAÇÃO DO USUÁRIO:
- Rota atual: ${context.currentPath || "/"}
- Pessoa em foco na árvore: ${context.personName ? `${context.personName} (ID: ${context.personId || "N/D"})` : "Nenhuma selecionada no momento"}
${context.totalAncestors ? `- Total de ancestrais auditados: ${context.totalAncestors} ao longo de ${context.generations || 4} gerações.` : ""}

Seja conciso, direto e ofereça passos acionáveis.`;

    // Map conversation messages to Gemini format
    const geminiContents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    let lastError: unknown = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 1200,
          },
          contents: geminiContents,
        });

        const replyText =
          response.text || "Desculpe, não consegui formular uma resposta no momento.";

        return NextResponse.json({
          success: true,
          model,
          message: replyText,
        });
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[chat] Modelo ${model} falhou: ${errMsg}. Alternando para o próximo modelo...`,
        );
      }
    }

    throw new Error(
      `Todos os modelos de IA falharam no momento: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    );
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const msg = error instanceof Error ? error.message : "Erro interno no copiloto";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
