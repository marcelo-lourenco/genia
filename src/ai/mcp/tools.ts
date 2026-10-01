import { z } from "zod";
import { analyzeManuscript } from "@/ai/gemini/vision";
import { getDgsMetadata } from "@/services/familysearch/dgs";
import { getPersonDetails } from "@/services/familysearch/person";
import { type SearchPersonsParams, searchPersons } from "@/services/familysearch/search";
import { getTreeAncestors } from "@/services/familysearch/tree";

export interface McpToolDefinition<T extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: z.ZodObject<T>;
  handler: (args: z.infer<z.ZodObject<T>>) => Promise<unknown>;
}

export const mcpToolsRegistry: Record<string, McpToolDefinition> = {
  search_persons: {
    name: "search_persons",
    description: "Pesquisa indivíduos indexados na árvore ou registros históricos do FamilySearch",
    inputSchema: z.object({
      givenName: z
        .string()
        .optional()
        .describe("Primeiro nome ou variantes (ex: Ivan, Iwan, João)"),
      surname: z.string().describe("Sobrenome da pessoa (ex: Colosovschi, Colosovski)"),
      birthDate: z.string().optional().describe("Ano ou data aproximada de nascimento (ex: 1909)"),
      birthPlace: z
        .string()
        .optional()
        .describe("Localidade, aldeia ou distrito (ex: Beșghioz, Bender)"),
      fatherGivenName: z.string().optional().describe("Primeiro nome do pai (ex: Harlampe)"),
      motherGivenName: z.string().optional().describe("Primeiro nome da mãe (ex: Maria)"),
      count: z.number().optional().default(10),
    }),
    handler: async (args) => {
      return await searchPersons(args as SearchPersonsParams);
    },
  },

  get_person_details: {
    name: "get_person_details",
    description:
      "Recupera a ficha genealógica completa (GEDCOM X) de um indivíduo a partir de seu ID no FamilySearch",
    inputSchema: z.object({
      personId: z.string().describe("Identificador do indivíduo no FamilySearch (ex: KWQS-BB1)"),
    }),
    handler: async (args) => {
      const { personId } = args as { personId: string };
      const person = await getPersonDetails(personId);
      if (!person) {
        throw new Error(`Pessoa com ID ${personId} não encontrada no FamilySearch.`);
      }
      return person;
    },
  },

  get_tree_ancestors: {
    name: "get_tree_ancestors",
    description:
      "Navega pela árvore de ascendência e identifica lacunas documentais (buracos na árvore)",
    inputSchema: z.object({
      personId: z.string().describe("ID da pessoa raiz da árvore"),
      generations: z.number().min(1).max(8).default(4).describe("Número de gerações para explorar"),
    }),
    handler: async (args) => {
      const { personId, generations } = args as { personId: string; generations?: number };
      return await getTreeAncestors(personId, generations);
    },
  },

  get_dgs_waypoints: {
    name: "get_dgs_waypoints",
    description:
      "Recupera metadados, processos arquivísticos (Delo/Opis/Fond) e waypoints de um rolo de microfilme DGS",
    inputSchema: z.object({
      dgsNumber: z.string().describe("Número do Grupo de Imagens / DGS (ex: 005610797)"),
    }),
    handler: async (args) => {
      const { dgsNumber } = args as { dgsNumber: string };
      return await getDgsMetadata(dgsNumber);
    },
  },

  analyze_manuscript_image: {
    name: "analyze_manuscript_image",
    description:
      "Envia imagem de fólio paroquial histórico para decifração paleográfica multimodal com Google Gemini Vision",
    inputSchema: z.object({
      imageBase64: z.string().describe("Conteúdo da imagem em Base64"),
      mimeType: z.string().optional().default("image/jpeg"),
      language: z.enum(["cyrillic_russian", "romanian", "general"]).default("cyrillic_russian"),
      targetPerson: z.string().optional().describe("Nome do indivíduo procurado"),
      targetSurname: z.string().optional().describe("Sobrenome procurado"),
      targetFather: z.string().optional().describe("Nome do pai procurado"),
      targetMother: z.string().optional().describe("Nome da mãe procurada"),
      targetDate: z.string().optional().describe("Data do evento procurado"),
      villageName: z.string().optional().describe("Aldeia ou paróquia"),
      year: z.string().optional().describe("Ano da folha"),
    }),
    handler: async (args) => {
      const typed = args as {
        imageBase64: string;
        mimeType?: string;
        language: "cyrillic_russian" | "romanian" | "general";
        villageName?: string;
        year?: string;
        targetPerson?: string;
        targetSurname?: string;
        targetFather?: string;
        targetMother?: string;
        targetDate?: string;
      };

      return await analyzeManuscript({
        imageBase64: typed.imageBase64,
        mimeType: typed.mimeType,
        language: typed.language,
        context: {
          villageName: typed.villageName,
          year: typed.year,
          targetPerson: typed.targetPerson,
          targetSurname: typed.targetSurname,
          targetFather: typed.targetFather,
          targetMother: typed.targetMother,
          targetDate: typed.targetDate,
        },
      });
    },
  },
};
