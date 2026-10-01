import { type NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/ai/gemini/client";
import {
  getPersonDetails,
  getPersonRelationships,
  getPersonSources,
} from "@/services/familysearch/person";
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
          const [details, sources, relationships] = await Promise.all([
            getPersonDetails(targetId).catch(() => null),
            getPersonSources(targetId).catch(() => []),
            getPersonRelationships(targetId).catch(() => ({
              spouses: [],
              parents: [],
              children: [],
            })),
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

            dataBlock += `\nESTRUTURA DE PARENTESCO OFICIAL NO FAMILYSEARCH (ATENÇÃO RIGOROSA):\n`;
            dataBlock += `- CÔNJUGE(S) / MARIDO / ESPOSA: ${
              relationships.spouses.length > 0
                ? relationships.spouses.map((s) => `${s.name} (ID: ${s.id})`).join(", ")
                : "Nenhum cônjuge cadastrado na árvore"
            }\n`;
            dataBlock += `- PAIS (FILIAÇÃO / GENITORES): ${
              relationships.parents.length > 0
                ? relationships.parents.map((p) => `${p.name} (ID: ${p.id})`).join(", ")
                : "Nenhum pai/mãe vinculado diretamente no perfil principal da árvore"
            }\n`;
            dataBlock += `- FILHOS VINCULADOS (${relationships.children.length}): ${
              relationships.children.length > 0
                ? relationships.children.map((c) => `${c.name} (ID: ${c.id})`).join(", ")
                : "Nenhum filho vinculado"
            }\n`;

            dataBlock += `\nDOCUMENTOS E FONTES ARQUIVÍSTICAS ANEXADAS NO FAMILYSEARCH (${sources.length} fontes anexadas):\n`;
            if (sources.length === 0) {
              dataBlock += `- Nenhuma fonte anexada até o momento para este perfil.\n`;
            } else {
              sources.forEach((s, idx) => {
                dataBlock += `${idx + 1}. [${s.titles.join(" / ") || "Documento Histórico"}]\n`;
                if (s.citation) {
                  dataBlock += `   Citação/Resumo: ${s.citation.replace(/<[^>]+>/g, "")}\n`;
                }
                if (s.url) {
                  dataBlock += `   Link do Registro/Imagem: ${s.url}\n`;
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
3. **RIGOR ABSOLUTO EM GRAUS DE PARENTESCO (ZERO CONFUSÃO):**
   - **NUNCA CONFUNDA CÔNJUGE (MARIDO/ESPOSA) COM PAI OU MÃE!**
   - Consulte ESTRITAMENTE a seção "ESTRUTURA DE PARENTESCO OFICIAL NO FAMILYSEARCH" fornecida nos dados reais.
   - Exemplo crucial: Em Maria Fausta Alves (GYT8-1CB), José Correia dos Santos é o MARIDO/CÔNJUGE (pai dos filhos dela), e NÃO o pai de Maria Fausta! Os pais dela são genitores distintos. Jamais diga que o cônjuge é o pai de alguém.
   - Ao citar filhos, identifique-os como filhos do casal (ou da pessoa analisada).
4. **TRANSPARÊNCIA TOTAL SOBRE O ACESSO A IMAGENS & FONTES:**
   - Diga explicitamente ao usuário quais registros e fontes você consultou na árvore (ex: certidões de óbito civil de 1978 em Osasco, registros de casamento dos filhos, índices paroquiais de Sergipe).
   - Informe com clareza se o registro no FamilySearch possui imagem digitalizada aberta, se é um índice transcrito, ou se a imagem original está sujeita a restrição de custódia paroquial/cartorial (exigindo FamilySearch Center).
   - O usuário NÃO quer e você NÃO DEVE mandar links de livros ou microfilmes para o usuário "folhear" ou "abrir" por conta própria. VOCÊ deve analisar tudo o que for acessível.
   - SÓ forneça um link direto para o usuário quando o documento estiver confirmado com alto valor probatório, explicando exatamente o que a imagem comprova.
5. **RESPOSTAS DENSAS, FUNDAMENTADAS E SEM ENROLIZAÇÃO (PROIBIDO RESPOSTAS RASAS):**
   - Não fique apenas prometendo ("vou analisar", "estou processando", "já estou cruzando").
   - Apresente IMEDIATAMENTE os fatos concretos encontrados: nomes exatos, IDs, idades declaradas em óbitos/casamentos, datas parciais, lacunas documentais e os cartórios/paróquias exatos para sanar cada dúvida.
   - Se o usuário perguntar pela data exata de nascimento:
     a) Apresente o que consta no perfil e nas certidões de óbito e casamento anexadas (ex: idade declarada no óbito civil de Osasco em 1978 permite calcular a margem exata de meses/ano).
     b) Aponte os pais legítimos conhecidos e cônjuge de forma inequívoca.
     c) Especifique a paróquia exata (ex: Paróquia de Nossa Senhora das Dores, Sergipe) e os passos arquivísticos para localizar o assento paroquial ou registro civil de nascimento.
6. **ANÁLISE DE PRINTS E IMAGENS ANEXADAS PELO USUÁRIO:**
   - Se o usuário anexar imagem/print, analise visualmente o manuscrito ou aviso, transcreva o conteúdo e emita o parecer probatório direto.
7. Responda em Português do Brasil com clareza, respeito, objetividade e rigor científico segundo o Genealogical Proof Standard (GPS).

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
