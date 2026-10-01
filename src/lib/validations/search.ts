import { z } from "zod";

export const searchFormSchema = z.object({
  // Identificação Principal
  givenName: z.string().trim().optional(),
  surname: z.string().trim().min(2, "O sobrenome deve ter pelo menos 2 caracteres"),
  gender: z.string().trim().optional(),

  // Eventos Vitais
  birthDate: z.string().trim().optional(),
  birthPlace: z.string().trim().optional(),
  marriageDate: z.string().trim().optional(),
  marriagePlace: z.string().trim().optional(),
  deathDate: z.string().trim().optional(),
  deathPlace: z.string().trim().optional(),

  // Relações Familiares
  fatherGivenName: z.string().trim().optional(),
  fatherSurname: z.string().trim().optional(),
  motherGivenName: z.string().trim().optional(),
  motherSurname: z.string().trim().optional(),
  spouseGivenName: z.string().trim().optional(),
  spouseSurname: z.string().trim().optional(),

  // Parâmetros de Arquivo, Coleção e Idioma
  dgsNumber: z.string().trim().optional(),
  filmNumber: z.string().trim().optional(),
  keywords: z.string().trim().optional(),
  collection: z.string().trim().optional(),
  language: z.string().default("cyrillic_russian"),
});

export type SearchFormData = z.infer<typeof searchFormSchema>;
