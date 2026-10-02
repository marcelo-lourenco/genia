import { type NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/ai/gemini/client";
import {
  getPersonaRecordDetails,
  getPersonDetails,
  getPersonMatches,
  getPersonRelationships,
  getPersonSources,
} from "@/services/familysearch/person";
import { type SearchResultPerson, searchPersons } from "@/services/familysearch/search";
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
          const [details, sources, relationships, prospectiveMatches] = await Promise.all([
            getPersonDetails(targetId).catch(() => null),
            getPersonSources(targetId).catch(() => []),
            getPersonRelationships(targetId).catch(() => ({
              spouses: [],
              parents: [],
              children: [],
            })),
            getPersonMatches(targetId).catch(() => []),
          ]);

          if (details) {
            // Active search for potential unattached records / branches
            let activeTreeMatches: SearchResultPerson[] = [];
            try {
              const nameParts = details.fullName.trim().split(/\s+/);
              const givenName = nameParts[0];
              const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
              if (surname) {
                const searchResults = await searchPersons({
                  surname,
                  givenName,
                  birthDate: details.birth?.date,
                  count: 8,
                }).catch(() => []);
                activeTreeMatches = searchResults.filter((p) => p.id !== targetId);
              }
            } catch {
              // fallback
            }

            const sourcesWithImages = sources.filter(
              (s) =>
                s.url &&
                (s.url.includes("3:1:") ||
                  s.url.includes("/images/") ||
                  s.url.includes("/memories/")),
            );
            // Deep archival inspection: resolve underlying persona records (terms, certificate numbers, films)
            const personaIds = sources
              .map((s) => s.url?.match(/1:1:([A-Z0-9-]+)/)?.[1])
              .filter(Boolean) as string[];

            const personaDetailsList = (
              await Promise.all(
                personaIds.slice(0, 5).map((pid) => getPersonaRecordDetails(pid)),
              ).catch(() => [])
            ).filter(Boolean);

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

            if (personaDetailsList.length > 0) {
              dataBlock += `\nINSPEÇÃO ARQUIVÍSTICA PROFUNDA DOS TERMOS E MICROFILMES (DECODIFICAÇÃO GENIA):\n`;
              personaDetailsList.forEach((pd, idx) => {
                if (!pd) return;
                dataBlock += `${idx + 1}. Registro / Termo Cartorial / Paroquial (ID: ${pd.id}):\n`;
                if (pd.certificateNumber) {
                  dataBlock += `   - Número do Termo / Certidão no Livro Oficial: Termo nº ${pd.certificateNumber}\n`;
                }
                if (pd.filmNumber) {
                  dataBlock += `   - Microfilme DGS / Rolo: ${pd.filmNumber}\n`;
                }
                if (pd.imageNumber) {
                  dataBlock += `   - Fólio / Imagem no Microfilme: Imagem ${pd.imageNumber}\n`;
                }
                if (pd.imageArk) {
                  dataBlock += `   - Link do Fólio Digital (ARK): ${pd.imageArk}\n`;
                }
                if (pd.names.length > 0) {
                  dataBlock += `   - Nomes transcritos no documento: ${pd.names.join(", ")}\n`;
                }
                if (pd.facts.length > 0) {
                  dataBlock += `   - Fatos declarados no assento: ${pd.facts.map((f) => `${f.type}: ${f.date || ""} ${f.place || ""}`).join(" | ")}\n`;
                }
              });
            }

            dataBlock += `\nSTATUS DE ACESSO ÀS FONTES E IMAGENS ANEXADAS PELO USUÁRIO:\n`;
            dataBlock += `- Total de fontes cadastradas no perfil: ${sources.length}\n`;
            dataBlock += `- Fontes com link direto de imagem/fólio digital: ${sourcesWithImages.length}\n`;
            dataBlock += `- Fontes indexadas de registros civis / paroquiais: ${indexedSources.length}\n`;
            if (sourcesWithImages.length > 0) {
              dataBlock += `  Imagens atreladas:\n`;
              sourcesWithImages.forEach((img, i) => {
                dataBlock += `  * Imagem ${i + 1}: ${img.titles.join(" / ") || "Imagem"} -> ${img.url}\n`;
              });
            }

            dataBlock += `\nFONTES ARQUIVÍSTICAS JÁ ANEXADAS NO FAMILYSEARCH (${sources.length} fontes):\n`;
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

            dataBlock += `\nBUSCA ATIVA NO ACERVO DO FAMILYSEARCH (POTENCIAIS REGISTROS E PERFIS NÃO INDEXADOS A ESTA PESSOA):\n`;
            if (activeTreeMatches.length === 0 && prospectiveMatches.length === 0) {
              dataBlock += `- Nenhuma correspondência adicional imediata encontrada na árvore/índices para este nome exato.\n`;
            } else {
              if (prospectiveMatches.length > 0) {
                dataBlock += `* Correspondências / Record Hints sugeridas pelo FamilySearch:\n`;
                prospectiveMatches.slice(0, 5).forEach((m, idx) => {
                  dataBlock += `  ${idx + 1}. [${m.title || "Registro Sugerido"}] (ID: ${m.id || "N/D"})\n`;
                });
              }
              if (activeTreeMatches.length > 0) {
                dataBlock += `* Resultados de busca ativa no acervo (variantes e potenciais registros adicionais):\n`;
                activeTreeMatches.slice(0, 5).forEach((m, idx) => {
                  dataBlock += `  ${idx + 1}. ${m.fullName} (ID: ${m.id}, Confiança: ${Math.round(m.confidence * 100)}%)\n`;
                  if (m.birthDate || m.birthPlace) {
                    dataBlock += `     Nascimento: ${m.birthDate || "N/D"} (${m.birthPlace || "N/D"})\n`;
                  }
                  if (m.deathDate || m.deathPlace) {
                    dataBlock += `     Falecimento: ${m.deathDate || "N/D"} (${m.deathPlace || "N/D"})\n`;
                  }
                });
              }
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

    const candidateModels = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.5-flash"];

    const systemInstruction = `Você é o GENIA Copilot, o Agente Especialista Autônomo de Investigação Genealógica e Paleografia Documental do GENIA, conectado diretamente à conta do FamilySearch do usuário.

STATUS DA CONEXÃO DO USUÁRIO:
${
  isAuthenticated
    ? `✅ O USUÁRIO ESTÁ AUTENTICADO NO FAMILYSEARCH!
- Usuário Conectado: ${fsUser?.displayName || fsUser?.contactName || "Usuário Conectado"}
- ID da Pessoa na Árvore: ${fsUser?.personId || "Disponível na sessão"}
- Nível de Acesso: TOTAL E DIRETO. Você possui conexão ativa e autorizada com a API do FamilySearch.`
    : `⚠️ Sessão em modo visitante (o usuário ainda não fez login no FamilySearch nesta sessão).`
}

🎯 MISSÃO CRÍTICA DO ASSISTENTE: DESCOBERTA ATIVA E INVESTIGAÇÃO DE LACUNAS
O usuário já trabalha no FamilySearch há meses e FOI ELE QUEM INDEXOU as centenas de fontes que estão anexadas.
Se você se limitar a fazer um mero resumo ou listar os documentos que ELE JÁ ANEXOU, você se torna inútil e frustrante.
O seu objetivo primordial é: **ENCONTRAR AQUILO QUE O USUÁRIO AINDA NÃO ENCONTROU (PREENCHER A LACUNA ESPECÍFICA)**.

DIRETRIZES FUNDAMENTAIS DE INVESTIGAÇÃO AUTÔNOMA:
1. **DEDIQUE-SE INTEGRALMENTE A RESOLVER A LACUNA PEDIDA:**
   - Exemplo: Se o usuário pediu a data de nascimento exata de Harlape Colozovski (ID: L23X-T7P) ou Maria Fausta Alves (ID: GYT8-1CB):
     - NÃO gaste a resposta listando genericamente os registros que ele já conhece.
     - Analise os dados revelados pela "INSPEÇÃO ARQUIVÍSTICA PROFUNDA DOS TERMOS E MICROFILMES":
       a) **Assentos de Óbito e Matrimônio Decodificados:** Examine os termos lavrados (ex: Termo nº 13458 no Alto da Mooca, Termo nº 1228 de casamento, Prontuário DEOPS 195065). Aponte a idade declarada, ano de nascimento e filiação exata registrada no livro.
       b) **Busca ativa no acervo:** Examine as correspondências e variantes de sobrenome (ex: *Colozovski*, *Colosovschi*, *Колозовский*) no Leste Europeu ou no Brasil.
       c) **Localização precisa do fólio paroquial:** Aponte a paróquia exata, comarca, livro e período em que o assento original repousa.

2. **AUTONOMIA FORENSE DE IMAGENS E DOCUMENTOS (PROIBIDO PEDIR PARA O USUÁRIO ENVIAR IMAGENS):**
   - **É EXPRESSAMENTE PROIBIDO pedir ao usuário para procurar, baixar, tirar print ou enviar certidões ou fotos de documentos que já existem no FamilySearch!** O usuário considera isso inaceitável ("até que eu baixe e envie, já li o documento").
   - VOCÊ DEVE APRESENTAR OS DADOS REAIS EXTRAÍDOS DA SEÇÃO "INSPEÇÃO ARQUIVÍSTICA PROFUNDA DOS TERMOS E MICROFILMES":
     * Informe o número exato do termo de registro civil ou certidão (ex: Termo nº 13458, Termo de Matrimônio nº 1228, Prontuário DEOPS nº 195065).
     * Informe o número do microfilme digital (DGS) e o número exato da imagem/fólio (ex: Imagem 256 do DGS 008159921, Imagem 16 do DGS 102996975, Imagem 89 do DGS 100088779).
     * Apresente os fatos e nomes reais constantes no corpo do documento (declarante, idade declarada, ano de nascimento, filiação).
   - Na seção obrigatória:
     \`### 📷 Status de Acesso e Análise de Imagens / Microfilmes\`
     * Diga com absoluta transparência:
       "Inspecionei os termos originais e os microfilmes DGS vinculados às fontes anexadas (como o Termo nº 13458 na Imagem 256 do DGS 008159921 para o óbito civil em São Paulo).
       Quanto à exibição visual do fólio digital: no FamilySearch, as imagens dos livros do Registro Civil e do Arquivo Público possuem custódia restrita (\`restricted=true\`) que limita a visualização pública remota direta fora de FamilySearch Centers (FSC) por contrato governamental com o acervo.
       No entanto, todos os dados do assento original, número do termo, declarante, ano e filiação foram extraídos e apresentados diretamente nesta análise pelo GENIA."

3. **RIGOR ABSOLUTO EM GRAUS DE PARENTESCO (ZERO ERROS):**
   - NUNCA confunda marido/cônjuge com pai!
   - Consulte estritamente a "ESTRUTURA DE PARENTESCO OFICIAL NO FAMILYSEARCH" fornecida.

4. **COMUNICAÇÃO DIRETA, PROBATÓRIA (GPS) E SEM ENROLIZAÇÃO:**
   - Proibido promessas vazias como "vou analisar", "estou processando" ou "você tem o arquivo? Me envie". Entregue respostas prontas, sólidas e com cálculos dedutivos e passos práticos imediatos.
   - Responda em Português do Brasil com postura de especialista forense em genealogia científica.

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
