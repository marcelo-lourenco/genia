import { z } from "zod";

export const searchFormSchema = z.object({
  givenName: z.string().trim().optional(),
  surname: z.string().trim().min(2, "O sobrenome deve ter pelo menos 2 caracteres"),
  birthDate: z.string().trim().optional(),
  birthPlace: z.string().trim().optional(),
  fatherGivenName: z.string().trim().optional(),
  motherGivenName: z.string().trim().optional(),
  dgsNumber: z.string().trim().optional(),
  language: z.enum(["cyrillic_russian", "romanian", "general"]).default("cyrillic_russian"),
});

export type SearchFormData = z.infer<typeof searchFormSchema>;
