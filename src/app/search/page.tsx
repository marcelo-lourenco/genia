"use client";

import { Eye, FileSearch, Layers, Sparkles } from "lucide-react";
import { useState } from "react";
import { ManuscriptViewer } from "@/components/genea/ManuscriptViewer";
import { SearchForm } from "@/components/genea/SearchForm";
import type { SearchResultPerson } from "@/services/familysearch/search";

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<"records" | "vision">("records");
  const [results, setResults] = useState<SearchResultPerson[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [_selectedPerson, setSelectedPerson] = useState<SearchResultPerson | null>(null);

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-8 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Caso de Uso 1: Busca Ativa & Multimodal
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Pesquisa & Paleografia Digital
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Pesquise registros indexados do FamilySearch e transcreva fólios paroquiais manuscritos
            com o Gemini Vision
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-xl bg-muted border border-border self-start shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("records")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "records"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>Busca de Registros</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vision")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "vision"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Paleografia Vision</span>
          </button>
        </div>
      </div>

      {activeTab === "records" ? (
        <div className="space-y-8">
          {/* Form Card */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm text-card-foreground">
            <SearchForm onResults={setResults} onSearchingChange={setIsSearching} />
          </div>

          {/* Results List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Resultados Encontrados ({results.length})
              </h3>
              {isSearching && (
                <span className="text-xs text-primary font-medium animate-pulse">
                  Consultando registros no FamilySearch...
                </span>
              )}
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((person) => (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => setSelectedPerson(person)}
                    className="p-5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left flex flex-col justify-between gap-3 group w-full shadow-sm hover:shadow text-card-foreground cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-2xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          {person.id}
                        </span>
                        <span className="text-2xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                          {Math.round(person.confidence * 100)}% Match
                        </span>
                      </div>

                      <h4 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                        {person.name}
                      </h4>

                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        {person.gender && (
                          <p>
                            <span className="text-muted-foreground/70">Gênero:</span>{" "}
                            {person.gender === "Male" ? "Masculino" : "Feminino"}
                          </p>
                        )}
                        {person.birthDate && (
                          <p>
                            <span className="text-muted-foreground/70">Nascimento:</span>{" "}
                            {person.birthDate}
                          </p>
                        )}
                        {person.birthPlace && (
                          <p>
                            <span className="text-muted-foreground/70">Local:</span>{" "}
                            {person.birthPlace}
                          </p>
                        )}
                        {person.parents && person.parents.length > 0 && (
                          <p>
                            <span className="text-muted-foreground/70">Pais:</span>{" "}
                            {person.parents.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border pt-3 flex items-center justify-between text-2xs text-muted-foreground">
                      <span>Clique para ver detalhes</span>
                      <span className="text-primary font-medium group-hover:underline">
                        Visualizar &rarr;
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              !isSearching && (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card/50 text-muted-foreground text-xs">
                  Nenhum registro pesquisado ainda. Preencha o formulário acima ou carregue o caso
                  de demonstração da Bessarábia.
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm text-card-foreground">
          <ManuscriptViewer />
        </div>
      )}
    </main>
  );
}
