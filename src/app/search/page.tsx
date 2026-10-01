"use client";

import {
  BookOpen,
  Camera,
  Database,
  Eye,
  FileSearch,
  FileText,
  Layers,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ManuscriptViewer } from "@/components/genea/ManuscriptViewer";
import { SearchForm } from "@/components/genea/SearchForm";
import type { SearchResultPerson } from "@/services/familysearch/search";

type SearchModality = "records" | "fulltext" | "images" | "tree" | "genealogies" | "vision";

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<SearchModality>("records");
  const [results, setResults] = useState<SearchResultPerson[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [_selectedPerson, setSelectedPerson] = useState<SearchResultPerson | null>(null);

  // Full-text search state
  const [fullTextQuery, setFullTextQuery] = useState("");
  const [fullTextPlace, setFullTextPlace] = useState("");
  const [fullTextDate, setFullTextDate] = useState("");

  // DGS image search state
  const [dgsNumber, setDgsNumber] = useState("");
  const [imageIndex, setImageIndex] = useState("");

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-8 transition-colors">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Pesquisa Universal & Agente Autônomo
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Central de Pesquisa Genealógica
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Explore registros mundiais do FamilySearch, texto completo por IA, microfilmes DGS e
            decifração de manuscritos
          </p>
        </div>

        {/* Modalidade de Busca (Categorias Padrão FamilySearch) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted border border-border shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("records")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "records"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>Registros Históricos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fulltext")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "fulltext"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Texto Completo (IA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "images"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Imagens & DGS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tree")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "tree"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Árvore Familiar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("genealogies")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "genealogies"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Livros & Genealogias</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vision")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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

      {/* Conteúdo Dinâmico por Aba */}
      {activeTab === "records" && (
        <div className="space-y-8">
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
                  Nenhum registro pesquisado ainda. Preencha os campos de busca acima para consultar
                  qualquer repositório no FamilySearch.
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ABA 2: Texto Completo (IA) */}
      {activeTab === "fulltext" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm text-card-foreground space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Pesquisa em Texto Completo (Full-Text Search com IA)
              </h3>
              <p className="text-xs text-muted-foreground">
                Pesquise palavras, frases, nomes de fazendas, profissões e termos em milhões de
                documentos históricos transcritos por inteligência artificial
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="fulltext-terms"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Termos de Busca, Nomes ou Expressões
              </label>
              <input
                id="fulltext-terms"
                value={fullTextQuery}
                onChange={(e) => setFullTextQuery(e.target.value)}
                placeholder="Ex: 'Manuel da Silva' testamento 'Vila Rica' escravos"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="fulltext-place"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Local ou Jurisdição
              </label>
              <input
                id="fulltext-place"
                value={fullTextPlace}
                onChange={(e) => setFullTextPlace(e.target.value)}
                placeholder="Ex: Minas Gerais, Brasil ou Napoli, Italia"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="fulltext-date"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Intervalo de Anos
              </label>
              <input
                id="fulltext-date"
                value={fullTextDate}
                onChange={(e) => setFullTextDate(e.target.value)}
                placeholder="Ex: 1850-1920"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("records");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Executar Busca em Texto Completo</span>
            </button>
          </div>
        </div>
      )}

      {/* ABA 3: Imagens & DGS */}
      {activeTab === "images" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm text-card-foreground space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Navegador de Imagens Históricas & Microfilmes (DGS)
              </h3>
              <p className="text-xs text-muted-foreground">
                Acesse rolos de microfilmes digitalizados diretamente pelo número do Grupo de
                Imagens (DGS) ou número do filme físico
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="dgs-num"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Número do DGS (Digital Film Group)
              </label>
              <input
                id="dgs-num"
                value={dgsNumber}
                onChange={(e) => setDgsNumber(e.target.value)}
                placeholder="Ex: 005610797, 007963214..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="img-num"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Imagem ou Fólio Específico (Opcional)
              </label>
              <input
                id="img-num"
                value={imageIndex}
                onChange={(e) => setImageIndex(e.target.value)}
                placeholder="Ex: 1, 42, 342..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Carregar Fólios do DGS</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Dica de Pesquisa:</strong> Muitos registros
            arquivísticos (como livros paroquiais católicos ou livros civis) ainda não foram
            indexados nome a nome no FamilySearch, mas estão disponíveis como imagens digitais
            pesquisáveis fólio a fólio. Utilize a ferramenta <strong>Paleografia Vision</strong>{" "}
            para transcrever qualquer imagem que encontrar.
          </div>
        </div>
      )}

      {/* ABA 4: Árvore Familiar */}
      {activeTab === "tree" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm text-card-foreground space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Busca de Pessoas na Árvore Familiar Compartilhada
              </h3>
              <p className="text-xs text-muted-foreground">
                Pesquise entre mais de 1,4 bilhão de pessoas cadastradas na Árvore Familiar global
                do FamilySearch
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tree-person-name"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Nome da Pessoa
              </label>
              <input
                id="tree-person-name"
                placeholder="Ex: João da Silva"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="tree-person-id"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Ou ID do Indivíduo (Identificador FamilySearch)
              </label>
              <input
                id="tree-person-id"
                placeholder="Ex: KWQS-BB1 ou LXYZ-123"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <a
              href="/my-tree"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>Explorar no Gráfico de Linhagem & Pedigree</span>
            </a>
          </div>
        </div>
      )}

      {/* ABA 5: Genealogias & Livros */}
      {activeTab === "genealogies" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm text-card-foreground space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Biblioteca Digital, Catálogo & Cemitérios
              </h3>
              <p className="text-xs text-muted-foreground">
                Acesse mais de 500.000 livros de história da família, compêndios genealógicos
                publicados, anuários e registros de cemitérios
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="catalog-title"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Título do Livro ou Família / Sobrenome
              </label>
              <input
                id="catalog-title"
                placeholder="Ex: Nobiliário de Famílias de Portugal, Família Souza..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label
                htmlFor="catalog-author"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Autor ou Localidade de Publicação
              </label>
              <input
                id="catalog-author"
                placeholder="Ex: Felgueiras Gayo, Rio de Janeiro..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Integrado com o catálogo aberto do FamilySearch Digital Library & Internet Archive.
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-semibold border border-border cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Consultar Catálogo</span>
            </button>
          </div>
        </div>
      )}

      {/* ABA 6: Paleografia Vision */}
      {activeTab === "vision" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm text-card-foreground">
          <ManuscriptViewer />
        </div>
      )}
    </main>
  );
}
