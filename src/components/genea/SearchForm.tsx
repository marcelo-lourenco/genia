"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Globe,
  Heart,
  Loader2,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
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
  const [showAdvancedEvents, setShowAdvancedEvents] = useState(true);
  const [showFamilyRelations, setShowFamilyRelations] = useState(true);
  const [showArchiveOptions, setShowArchiveOptions] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      givenName: "",
      surname: "",
      gender: "all",
      birthDate: "",
      birthPlace: "",
      marriageDate: "",
      marriagePlace: "",
      deathDate: "",
      deathPlace: "",
      fatherGivenName: "",
      fatherSurname: "",
      motherGivenName: "",
      motherSurname: "",
      spouseGivenName: "",
      spouseSurname: "",
      dgsNumber: "",
      filmNumber: "",
      keywords: "",
      collection: "",
      language: "any",
    },
  });

  const handleClear = () => {
    reset();
    setError(null);
  };

  const handleLoadDemo = () => {
    setValue("givenName", "Antônio");
    setValue("surname", "Lourenço");
    setValue("gender", "male");
    setValue("birthDate", "1952");
    setValue("birthPlace", "São Paulo, Brasil");
    setValue("fatherGivenName", "Manoel");
    setValue("fatherSurname", "Lourenço");
    setValue("motherGivenName", "Maria");
    setValue("motherSurname", "Silva");
    setValue("language", "portuguese");
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
            gender: data.gender === "all" ? undefined : data.gender,
            birthDate: data.birthDate || undefined,
            birthPlace: data.birthPlace || undefined,
            marriageDate: data.marriageDate || undefined,
            marriagePlace: data.marriagePlace || undefined,
            deathDate: data.deathDate || undefined,
            deathPlace: data.deathPlace || undefined,
            fatherGivenName: data.fatherGivenName || undefined,
            fatherSurname: data.fatherSurname || undefined,
            motherGivenName: data.motherGivenName || undefined,
            motherSurname: data.motherSurname || undefined,
            spouseGivenName: data.spouseGivenName || undefined,
            spouseSurname: data.spouseSurname || undefined,
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
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary" />
            Parâmetros de Pesquisa de Registros Históricos
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pesquise certidões paroquiais, civis, censitárias e dados vitais indexados no
            FamilySearch
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
            title="Preencher com exemplo de busca"
          >
            <Sparkles className="w-3.5 h-3.5" /> Exemplo Rápido
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
            title="Limpar todos os campos"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SESSÃO 1: Identificação Principal */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-primary" />
          Identificação da Pessoa
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Sobrenome (Obrigatório) */}
          <div>
            <label htmlFor="surname" className="block font-semibold text-foreground mb-1.5">
              Sobrenome <span className="text-destructive">*</span>
            </label>
            <input
              id="surname"
              {...register("surname")}
              placeholder="Ex: Lourenço, Silva, Rossi..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
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
              placeholder="Ex: Antônio, Giuseppe, John..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
            />
          </div>

          {/* Gênero */}
          <div>
            <label htmlFor="gender" className="block font-semibold text-foreground mb-1.5">
              Gênero
            </label>
            <select
              id="gender"
              {...register("gender")}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs cursor-pointer"
            >
              <option value="all">Qualquer / Todos</option>
              <option value="male">Masculino (♂)</option>
              <option value="female">Feminino (♀)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SESSÃO 2: Eventos de Vida (Nascimento, Casamento, Óbito) */}
      <div className="space-y-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowAdvancedEvents(!showAdvancedEvents)}
          className="flex items-center justify-between w-full text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            Eventos Vitais (Nascimento, Casamento e Falecimento)
          </span>
          {showAdvancedEvents ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showAdvancedEvents && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-1">
            {/* Nascimento: Data */}
            <div>
              <label htmlFor="birthDate" className="block font-semibold text-foreground mb-1.5">
                Data ou Ano de Nascimento
              </label>
              <input
                id="birthDate"
                {...register("birthDate")}
                placeholder="Ex: 1952 ou 15/04/1952"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>

            {/* Nascimento: Local */}
            <div>
              <label htmlFor="birthPlace" className="block font-semibold text-foreground mb-1.5">
                Local de Nascimento (Cidade/Estado/País)
              </label>
              <input
                id="birthPlace"
                {...register("birthPlace")}
                placeholder="Ex: São Paulo, Brasil ou Lisboa, Portugal"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>

            {/* Casamento: Data */}
            <div>
              <label htmlFor="marriageDate" className="block font-semibold text-foreground mb-1.5">
                Data ou Ano de Casamento
              </label>
              <input
                id="marriageDate"
                {...register("marriageDate")}
                placeholder="Ex: 1975 ou 10/12/1975"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>

            {/* Casamento: Local */}
            <div>
              <label htmlFor="marriagePlace" className="block font-semibold text-foreground mb-1.5">
                Local de Casamento
              </label>
              <input
                id="marriagePlace"
                {...register("marriagePlace")}
                placeholder="Ex: Campinas, São Paulo, Brasil"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>

            {/* Falecimento: Data */}
            <div>
              <label htmlFor="deathDate" className="block font-semibold text-foreground mb-1.5">
                Data ou Ano de Falecimento
              </label>
              <input
                id="deathDate"
                {...register("deathDate")}
                placeholder="Ex: 2010 ou 04/05/2010"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>

            {/* Falecimento: Local */}
            <div>
              <label htmlFor="deathPlace" className="block font-semibold text-foreground mb-1.5">
                Local de Falecimento
              </label>
              <input
                id="deathPlace"
                {...register("deathPlace")}
                placeholder="Ex: Rio de Janeiro, Brasil"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* SESSÃO 3: Relações Familiares (Parentesco) */}
      <div className="space-y-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowFamilyRelations(!showFamilyRelations)}
          className="flex items-center justify-between w-full text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-primary" />
            Parentesco & Vínculos Familiares
          </span>
          {showFamilyRelations ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showFamilyRelations && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-1">
            {/* Pai */}
            <div>
              <label
                htmlFor="fatherGivenName"
                className="block font-semibold text-foreground mb-1.5"
              >
                Primeiro Nome do Pai
              </label>
              <input
                id="fatherGivenName"
                {...register("fatherGivenName")}
                placeholder="Ex: Manoel"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>
            <div>
              <label htmlFor="fatherSurname" className="block font-semibold text-foreground mb-1.5">
                Sobrenome do Pai
              </label>
              <input
                id="fatherSurname"
                {...register("fatherSurname")}
                placeholder="Ex: Lourenço"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>

            {/* Mãe */}
            <div>
              <label
                htmlFor="motherGivenName"
                className="block font-semibold text-foreground mb-1.5"
              >
                Primeiro Nome da Mãe
              </label>
              <input
                id="motherGivenName"
                {...register("motherGivenName")}
                placeholder="Ex: Maria de Lourdes"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>
            <div>
              <label htmlFor="motherSurname" className="block font-semibold text-foreground mb-1.5">
                Sobrenome de Solteira da Mãe
              </label>
              <input
                id="motherSurname"
                {...register("motherSurname")}
                placeholder="Ex: Silva"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>

            {/* Cônjuge */}
            <div>
              <label
                htmlFor="spouseGivenName"
                className="block font-semibold text-foreground mb-1.5"
              >
                Primeiro Nome do Cônjuge
              </label>
              <input
                id="spouseGivenName"
                {...register("spouseGivenName")}
                placeholder="Ex: Sara"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>
            <div>
              <label htmlFor="spouseSurname" className="block font-semibold text-foreground mb-1.5">
                Sobrenome do Cônjuge
              </label>
              <input
                id="spouseSurname"
                {...register("spouseSurname")}
                placeholder="Ex: Leite"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* SESSÃO 4: Parâmetros de Arquivo, Coleção e Idioma */}
      <div className="space-y-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowArchiveOptions(!showArchiveOptions)}
          className="flex items-center justify-between w-full text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-primary" />
            Parâmetros de Microfilme (DGS), Coleção & Idioma
          </span>
          {showArchiveOptions ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showArchiveOptions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
            {/* DGS */}
            <div>
              <label htmlFor="dgsNumber" className="block font-semibold text-foreground mb-1.5">
                Grupo de Imagens (DGS)
              </label>
              <input
                id="dgsNumber"
                {...register("dgsNumber")}
                placeholder="Ex: 005610797"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>

            {/* Número do Filme */}
            <div>
              <label htmlFor="filmNumber" className="block font-semibold text-foreground mb-1.5">
                Número do Rolo / Filme
              </label>
              <input
                id="filmNumber"
                {...register("filmNumber")}
                placeholder="Ex: 1234567"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>

            {/* Coleção / Fundo */}
            <div>
              <label htmlFor="collection" className="block font-semibold text-foreground mb-1.5">
                Coleção / Acervo Arquivístico
              </label>
              <input
                id="collection"
                {...register("collection")}
                placeholder="Ex: Registros Paroquiais, Livros de Imigração..."
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
              />
            </div>

            {/* Idioma Abrangente */}
            <div>
              <label htmlFor="language" className="block font-semibold text-foreground mb-1.5">
                Idioma / Caligrafia do Registro
              </label>
              <select
                id="language"
                {...register("language")}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs cursor-pointer"
              >
                <option value="any">Qualquer Idioma (Detecção Automática)</option>
                <option value="portuguese">Português (Brasil / Portugal / Ilhas)</option>
                <option value="spanish">Espanhol (Espanha / Américas)</option>
                <option value="italian">Italiano (Stato Civile / Parrocchiali)</option>
                <option value="english">Inglês (UK / EUA / Canadá / Austrália)</option>
                <option value="german">Alemão / Kurrentschrift / Sütterlin</option>
                <option value="french">Francês (État civil / Paroisses)</option>
                <option value="cyrillic_russian">
                  Russo / Eslavo Cirílico (Метрические книги)
                </option>
                <option value="romanian">Romeno / Moldavo</option>
                <option value="latin">Latim Eclesiástico</option>
                <option value="polish">Polonês</option>
                <option value="hebrew">Hebraico / Iídiche</option>
                <option value="general">Outros / Não Especificado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2 border-t border-border">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Buscando registros no FamilySearch...</span>
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
