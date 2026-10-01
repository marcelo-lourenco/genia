"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, FileSearch, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { type SearchFormData, searchFormSchema } from "@/lib/validations/search";
import type { SearchResultPerson } from "@/services/familysearch/search";

interface SearchFormProps {
  onResults: (results: SearchResultPerson[]) => void;
  onSearchingChange: (isSearching: boolean) => void;
}

export function SearchForm({ onResults, onSearchingChange }: SearchFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      givenName: "",
      surname: "",
      birthDate: "",
      birthPlace: "",
      fatherGivenName: "",
      motherGivenName: "",
      dgsNumber: "",
      language: "cyrillic_russian",
    },
  });

  const handleLoadDemoCase = () => {
    setValue("givenName", "Iwan");
    setValue("surname", "Colosovschi");
    setValue("birthDate", "18/10/1909");
    setValue("birthPlace", "Beșghioz, Bender, Bessarabia");
    setValue("fatherGivenName", "Harlampe");
    setValue("motherGivenName", "Maria");
    setValue("dgsNumber", "005610797");
    setValue("language", "cyrillic_russian");
    setError(null);
  };

  const onSubmit = async (data: SearchFormData) => {
    setError(null);
    onSearchingChange(true);

    try {
      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "search_persons",
          arguments: {
            givenName: data.givenName || undefined,
            surname: data.surname,
            birthDate: data.birthDate || undefined,
            birthPlace: data.birthPlace || undefined,
            fatherGivenName: data.fatherGivenName || undefined,
            motherGivenName: data.motherGivenName || undefined,
          },
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Falha na busca pelo FamilySearch");
      }

      onResults(resData.result || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao pesquisar";
      setError(msg);
      onResults([]);
    } finally {
      onSearchingChange(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary" />
            Parâmetros de Pesquisa Genealógica
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Preencha os dados conhecidos para busca automatizada via API e correlação multimodal
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadDemoCase}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors self-start cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" /> Caso Bessarábia (Colosovschi)
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Sobrenome (Obrigatório) */}
        <div>
          <label htmlFor="surname" className="block font-semibold text-foreground mb-1.5">
            Sobrenome <span className="text-destructive">*</span>
          </label>
          <input
            id="surname"
            {...register("surname")}
            placeholder="Ex: Colosovschi ou Colosovski"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm"
          />
          {errors.surname && (
            <p className="text-destructive text-2xs mt-1">{errors.surname.message}</p>
          )}
        </div>

        {/* Primeiro Nome */}
        <div>
          <label htmlFor="givenName" className="block font-semibold text-foreground mb-1.5">
            Primeiro Nome (ou variantes)
          </label>
          <input
            id="givenName"
            {...register("givenName")}
            placeholder="Ex: Iwan, Ivan ou João"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm"
          />
        </div>

        {/* Data de Nascimento */}
        <div>
          <label htmlFor="birthDate" className="block font-semibold text-foreground mb-1.5">
            Data ou Ano de Nascimento
          </label>
          <input
            id="birthDate"
            {...register("birthDate")}
            placeholder="Ex: 18/10/1909 ou 1909"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm"
          />
        </div>

        {/* Local de Nascimento */}
        <div>
          <label htmlFor="birthPlace" className="block font-semibold text-foreground mb-1.5">
            Local / Paróquia / Província
          </label>
          <input
            id="birthPlace"
            {...register("birthPlace")}
            placeholder="Ex: Beșghioz, Bender, Bessarabia"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm"
          />
        </div>

        {/* Nome do Pai */}
        <div>
          <label htmlFor="fatherGivenName" className="block font-semibold text-foreground mb-1.5">
            Nome do Pai
          </label>
          <input
            id="fatherGivenName"
            {...register("fatherGivenName")}
            placeholder="Ex: Harlampe / Haralambie"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm"
          />
        </div>

        {/* Nome da Mãe */}
        <div>
          <label htmlFor="motherGivenName" className="block font-semibold text-foreground mb-1.5">
            Nome da Mãe
          </label>
          <input
            id="motherGivenName"
            {...register("motherGivenName")}
            placeholder="Ex: Maria (Terzi)"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm"
          />
        </div>

        {/* Número do Grupo de Imagens (DGS) */}
        <div>
          <label htmlFor="dgsNumber" className="block font-semibold text-foreground mb-1.5">
            Número do Grupo de Imagens / DGS
          </label>
          <input
            id="dgsNumber"
            {...register("dgsNumber")}
            placeholder="Ex: 005610797"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm"
          />
        </div>

        {/* Idioma da Paróquia */}
        <div>
          <label htmlFor="language" className="block font-semibold text-foreground mb-1.5">
            Idioma / Caligrafia Esperada
          </label>
          <select
            id="language"
            {...register("language")}
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-sm"
          >
            <option value="cyrillic_russian">Russo Cirílico Séc. XIX/XX (Метрические книги)</option>
            <option value="romanian">Romeno Moldavo (Grafia Antiga)</option>
            <option value="general">Geral / Multilíngue</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Buscando no FamilySearch...</span>
            </>
          ) : (
            <>
              <FileSearch className="w-4 h-4" />
              <span>Executar Busca no FamilySearch</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
