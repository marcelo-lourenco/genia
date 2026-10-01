import { type NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/ai/gemini/client";
import { getPersonDetails, getPersonSources } from "@/services/familysearch/person";
import { getCurrentUser } from "@/services/familysearch/user";
import { getSession } from "@/services/storage/session";

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
    const attachedImage: string | undefined = body.attachedImage;

    if (messages.length === 0 && !attachedImage) {
      return NextResponse.json(
        { success: false, error: "Nenhuma mensagem ou imagem enviada." },
        { status: 400 },
      );
    }

    // 1. Check active FamilySearch session
    const session = await getSession();
    const isAuthenticated = Boolean(session?.accessToken);
    let fsUser = null;
    if (isAuthenticated) {
      try {
        fsUser = await getCurrentUser();
      } catch {
        // session might still be valid for tree operations
      }
    }

    // 2. Detect any FamilySearch Person IDs in conversation or context
    const fullText = `${messages.map((m) => m.content).join(" ")} ${context.personId || ""}`;
    const idRegex = /\b([A-Z0-9]{4}-[A-Z0-9]{3,4})\b/gi;
    const detectedIds = Array.from(new Set(fullText.match(idRegex) || []));

    // 3. If IDs are present and session is active, retrieve real-time data directly from FamilySearch API
    const realTimeFamilySearchData: string[] = [];

    if (isAuthenticated && detectedIds.length > 0) {
      for (const targetId of detectedIds.slice(0, 3)) {
        try {
          const [details, sources] = await Promise.all([
            getPersonDetails(targetId).catch(() => null),
            getPersonSources(targetId).catch(() => []),
          ]);

          if (details) {
            let dataBlock = `\n======================================================\n`;
            dataBlock += `DADOS REAIS EM TEMPO REAL EXTRAÍDOS DO FAMILYSEARCH (PESSOA ID: ${targetId}):\n`;
            dataBlock += `- Nome Completo: ${details.fullName}\n`;
            if (details.alternateNames.length > 0) {
              dataBlock += `- Nomes Alternativos: ${details.alternateNames.join(", ")}\n`;
            }
            dataBlock += `- Gênero: ${details.gender || "Não informado"}\n`;
            dataBlock += `- Nascimento Registrado: ${details.birth?.date || "Data exata não consta no perfil principal"} (Local: ${details.birth?.place || "Não informado"})\n`;
            if (details.christening) {
              dataBlock += `- Batismo / Cristianização: ${details.christening.date || "Não informado"} (Local: ${details.christening.place || "Não informado"})\n`;
            }
            if (details.marriage) {
              dataBlock += `- Casamento: ${details.marriage.date || "Não informado"} (Local: ${details.marriage.place || "Não informado"})\n`;
            }
            if (details.death) {
              dataBlock += `- Falecimento / Óbito: ${details.death.date || "Não informado"} (Local: ${details.death.place || "Não informado"})\n`;
            }

            dataBlock += `\nDOCUMENTOS E FONTES ARQUIVÍSTICAS ANEXADAS NO FAMILYSEARCH (${sources.length} fontes anexadas):\n`;
            if (sources.length === 0) {
              dataBlock += `- Nenhuma fonte anexada até o momento para este perfil.\n`;
            } else {
              sources.forEach((s, idx) => {
                dataBlock += `${idx + 1}. [${s.titles.join(" / ") || "Documento Histórico"}]\n`;
                if (s.citation) {
                  dataBlock += `   Citação: ${s.citation.replace(/<[^>]+>/g, "")}\n`;
                }
                if (s.url) {
                  dataBlock += `   Link FamilySearch: ${s.url}\n`;
                }
              });
            }
            dataBlock += `======================================================\n`;
            realTimeFamilySearchData.push(dataBlock);
          }
        } catch (fetchErr) {
          console.warn(
            `[chat] Falha ao consultar dados do FamilySearch para ${targetId}:`,
            fetchErr,
          );
        }
      }
    }

    const ai = getGeminiClient();

    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
    ];

    const systemInstruction = `Você é o GENIA Copilot, um Assistente Especialista de Inteligência Artificial em Genealogia Científica, História Documental e Padrão de Prova Genealógica (GPS), plenamente conectado ao FamilySearch.

STATUS DA CONEXÃO DO USUÁRIO:
${
  isAuthenticated
    ? `✅ O USUÁRIO ESTÁ AUTENTICADO NO FAMILYSEARCH!
- Usuário Conectado: ${fsUser?.displayName || fsUser?.contactName || "Usuário Conectado"}
- ID da Pessoa na Árvore: ${fsUser?.personId || "Disponível na sessão"}
- Nível de Acesso: TOTAL E DIRETO. Você possui conexão ativa e autorizada com a API do FamilySearch.`
    : `⚠️ Sessão em modo visitante (o usuário ainda não fez login no FamilySearch nesta sessão).`
}

DIRETRIZES FUNDAMENTAIS E INEGOCIÁVEIS:
1. **NUNCA AFIRME QUE NÃO TEM ACESSO À CONTA OU À ÁRVORE DO USUÁRIO.** Quando o usuário estiver logado, você tem acesso pleno à API do FamilySearch. Todos os dados da árvore, fontes e anexos solicitados são consultados e disponibilizados em tempo real diretamente pelo sistema.
2. **NUNCA PEÇA AO USUÁRIO PARA COPIAR E COLAR DADOS OU FONTES QUE JÁ EXISTEM NO FAMILYSEARCH.** Você já lê os dados e os documentos anexados diretamente.
3. **AUTONOMIA MÁXIMA & PROIBIÇÃO DE REPASSAR TAREFAS DE ANÁLISE AO USUÁRIO:**
   - O usuário NÃO quer e você NÃO DEVE mandar links de livros, imagens ou microfilmes para o usuário "folhear", "abrir" ou "analisar" por conta própria.
   - VOCÊ é o especialista autônomo do GENIA. VOCÊ deve acessar, cruzar e analisar os dados e evidências sozinho.
   - NUNCA envie links aleatórios ou genéricos de microfilmes (URLs do tipo ark:/61903/3:1:...).
   - **RESTRIÇÕES DE IMAGENS NO FAMILYSEARCH (Atenção Crítica):**
     Muitos microfilmes e livros eclesiásticos/cartoriais possuem restrições contratuais de custódia e exibem o aviso "Imagem com restrição / Imagem não disponível on-line neste momento" (exigem consulta presencial em Centros de História da Família / FamilySearch Center). NUNCA envie links cegos de imagens sem antes avisar sobre essas restrições contratuais.
   - Você SÓ DEVE passar um link de documento ao usuário quando:
     a) Já tiver analisado o documento ou índice detalhadamente;
     b) Acreditar com alto grau de confiança probatória (GPS) que aquele registro é a pista exata do antepassado procurado;
     c) Apresentar junto com o link uma síntese completa do que o documento prova (nomes, datas, filiação, testemunhas).
4. **ANÁLISE DE PRINTS E IMAGENS ANEXADAS PELO USUÁRIO:**
   - Sempre que o usuário colar ou anexar um print ou imagem na mensagem, analise-o imediatamente com sua visão multimodal: transcreva o manuscrito ou aviso, extraia todos os dados visíveis e forneça o parecer probatório direto.
5. **SE O USUÁRIO FORNECER UM ID OU PERGUNTAR SOBRE UMA PESSOA (ex: GYT8-1CB):**
   - Examine minuciosamente os DADOS REAIS EXTRAÍDOS DO FAMILYSEARCH disponibilizados abaixo.
   - Apresente quem é a pessoa, as informações vitais já confirmadas e liste as fontes/documentos anexados.
   - Se o usuário perguntar se é possível saber a data exata de nascimento (ou qualquer lacuna):
     a) Verifique se a data exata já consta no perfil ou nas fontes.
     b) Se não constar, analise as fontes anexadas (ex: registros de casamento civil/religioso, certidões de filhos, assentamentos paroquiais de Sergipe, São Paulo, etc.). Mostre como deduzir a idade a partir desses termos (ex: idade declarada no matrimônio ou óbito) e indique exatamente em qual paróquia, comarca e intervalo de datas deve ser buscado o assento original de batismo ou nascimento para encontrar o dia e mês exatos.
6. Responda em Português do Brasil de forma elegante, proativa, encorajadora e fundamentada no Genealogical Proof Standard (GPS).

CONTEXTO DA NAVEGAÇÃO:
- Página atual: ${context.currentPath || "/"}
${context.personName ? `- Pessoa em foco na página: ${context.personName} (${context.personId || ""})` : ""}

${
  realTimeFamilySearchData.length > 0
    ? `DADOS CONSULTADOS DA SESSÃO ATIVA DO FAMILYSEARCH:\n${realTimeFamilySearchData.join("\n")}`
    : ""
}`;

    // Map conversation messages to Gemini format, including attached image if present
    const geminiContents = messages.map((m, idx) => {
      const isLastUser = idx === messages.length - 1 && m.role === "user";
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: m.content },
      ];

      if (isLastUser && attachedImage) {
        const cleanBase64 = attachedImage.replace(/^data:image\/\w+;base64,/, "");
        const mimeType = attachedImage.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
        parts.push({
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        });
      }

      return {
        role: m.role === "assistant" ? "model" : "user",
        parts,
      };
    });

    let lastError: unknown = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          config: {
            systemInstruction,
            temperature: 0.5,
            maxOutputTokens: 1500,
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
