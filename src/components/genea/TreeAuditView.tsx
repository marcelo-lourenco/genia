"use client";

import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle,
  ChevronRight,
  Compass,
  FileSearch,
  Loader2,
  Search,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { TreeAncestryAuditResult } from "@/services/familysearch/tree";

interface TreeAuditViewProps {
  initialData?: TreeAncestryAuditResult;
}

export function TreeAuditView({ initialData }: TreeAuditViewProps) {
  const [personId, setPersonId] = useState("KWQS-BB1");
  const [searchNameQuery, setSearchNameQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [isSearchingPersons, setIsSearchingPersons] = useState(false);
  const [generations, setGenerations] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [auditData, setAuditData] = useState<TreeAncestryAuditResult | null>(initialData || null);
  const [error, setError] = useState<string | null>(null);

  // AI Diagnosis state
  const [isGeneratingAiDiagnosis, setIsGeneratingAiDiagnosis] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<string | null>(null);

  // Auto-load on mount if no initialData
  // biome-ignore lint/correctness/useExhaustiveDependencies: initial load on mount
  useEffect(() => {
    if (!initialData && personId) {
      handleAudit(personId);
    }
  }, [initialData]);

  const handleAudit = async (targetId = personId) => {
    if (!targetId.trim()) return;
    setIsLoading(true);
    setError(null);
    setAiDiagnosis(null);

    try {
      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "get_tree_ancestors",
          arguments: { personId: targetId.trim(), generations },
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.result) {
        setAuditData(resData.result);
      } else {
        throw new Error(resData.error || "Não foi possível carregar a árvore para este ID.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao auditar árvore";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchPersonByName = async () => {
    if (!searchNameQuery.trim()) return;
    setIsSearchingPersons(true);
    setSearchResults([]);

    try {
      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "search_persons",
          arguments: {
            surname: searchNameQuery.trim(),
            count: 6,
          },
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.result?.persons) {
        setSearchResults(
          resData.result.persons.map((p: { id: string; name: string }) => ({
            id: p.id,
            name: p.name,
          })),
        );
      }
    } catch (err) {
      console.error("Person search error:", err);
    } finally {
      setIsSearchingPersons(false);
    }
  };

  const handleGenerateAiDiagnosis = async () => {
    if (!auditData) return;
    setIsGeneratingAiDiagnosis(true);

    try {
      const rootPerson = auditData.ancestors.find((a) => a.id === auditData.rootPersonId);
      const response = await fetch("/api/audit/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rootPersonName: rootPerson?.name || auditData.rootPersonId,
          totalAncestors: auditData.totalAncestorsFound,
          generations: auditData.generationsExplored,
          gaps: auditData.gaps,
        }),
      });

      const data = await response.json();
      if (data.success && data.diagnosis) {
        setAiDiagnosis(data.diagnosis);
      } else {
        throw new Error(data.error || "Não foi possível gerar o diagnóstico de IA");
      }
    } catch (err: unknown) {
      console.error("AI diagnosis failed:", err);
      setAiDiagnosis("Erro ao gerar diagnóstico com o Gemini. Verifique a chave de API.");
    } finally {
      setIsGeneratingAiDiagnosis(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Search & Filter Bar */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm text-card-foreground space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4">
          {/* Direct ID input */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="root-id"
                className="block text-2xs uppercase tracking-wider text-muted-foreground font-semibold mb-1"
              >
                ID da Pessoa Raiz (FamilySearch ID)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="root-id"
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value.toUpperCase())}
                  placeholder="Ex: KWQS-BB1, GYT8-36P..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground font-mono shadow-xs focus:ring-1 focus:ring-ring focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAudit(personId)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Compass className="w-3.5 h-3.5" />
                  )}
                  <span>{isLoading ? "Auditando..." : "Auditar Árvore"}</span>
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="gen-count"
                className="block text-2xs uppercase tracking-wider text-muted-foreground font-semibold mb-1"
              >
                Profundidade
              </label>
              <select
                id="gen-count"
                value={generations}
                onChange={(e) => setGenerations(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground shadow-xs focus:ring-1 focus:ring-ring focus:outline-none cursor-pointer"
              >
                <option value={2}>2 Gerações (Pais)</option>
                <option value={3}>3 Gerações (Avós)</option>
                <option value={4}>4 Gerações (Bisavós)</option>
                <option value={5}>5 Gerações (Trisavós)</option>
                <option value={6}>6 Gerações (Tetravós)</option>
              </select>
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPersonId("KWQS-BB1");
                handleAudit("KWQS-BB1");
              }}
              className="px-3 py-1.5 rounded-lg text-2xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer transition-colors"
            >
              Exemplo Raiz (KWQS-BB1)
            </button>
            <button
              type="button"
              onClick={() => {
                setPersonId("GYT8-36P");
                handleAudit("GYT8-36P");
              }}
              className="px-3 py-1.5 rounded-lg text-2xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer transition-colors"
            >
              Exemplo Árvore (GYT8-36P)
            </button>
          </div>
        </div>

        {/* Alternative: Search by name to find ID */}
        <div className="border-t border-border pt-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span className="text-2xs text-muted-foreground font-medium flex items-center gap-1">
              <Search className="w-3 h-3" /> Buscar Pessoa por Nome na Árvore:
            </span>
            <div className="flex-1 flex items-center gap-2">
              <input
                value={searchNameQuery}
                onChange={(e) => setSearchNameQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchPersonByName()}
                placeholder="Digite um sobrenome ou nome completo..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleSearchPersonByName}
                disabled={isSearchingPersons}
                className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold border border-border hover:bg-secondary/80 cursor-pointer"
              >
                {isSearchingPersons ? "Buscando..." : "Localizar"}
              </button>
            </div>
          </div>

          {/* Found search persons chips */}
          {searchResults.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <span className="text-2xs text-muted-foreground">Clique para auditar:</span>
              {searchResults.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    setPersonId(p.id);
                    handleAudit(p.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-medium cursor-pointer transition-colors"
                >
                  <User className="w-3 h-3" />
                  <span>{p.name}</span>
                  <span className="font-mono text-2xs opacity-75">({p.id})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* AI Diagnosis Strategic Banner */}
      {auditData && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-card to-blue-500/10 border border-purple-500/20 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Diagnóstico com Inteligência Artificial (Gemini)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Análise heurística de lacunas, recomendações arquivísticas e estratégia GPS passo
                  a passo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAiDiagnosis}
              disabled={isGeneratingAiDiagnosis}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer self-start sm:self-auto"
            >
              {isGeneratingAiDiagnosis ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analisando Lacunas com o Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Diagnóstico Estratégico</span>
                </>
              )}
            </button>
          </div>

          {aiDiagnosis && (
            <div className="mt-4 p-5 rounded-xl bg-background border border-purple-500/20 text-foreground text-xs leading-relaxed whitespace-pre-wrap font-sans shadow-inner">
              {aiDiagnosis}
            </div>
          )}
        </div>
      )}

      {auditData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ancestor Graph List (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Linhagem de Ancestrais Identificados ({auditData.ancestors.length})
              </h3>
              <span className="text-2xs text-muted-foreground font-mono">
                Pessoa Raiz: {auditData.rootPersonId}
              </span>
            </div>

            <div className="space-y-3">
              {auditData.ancestors.map((node, index) => {
                const isRoot = node.id === auditData.rootPersonId;
                const hasGap = auditData.gaps.some((g) => g.personId === node.id);

                return (
                  <div
                    key={node.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 shadow-sm ${
                      isRoot
                        ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-300 dark:border-blue-500/40 ring-1 ring-blue-500/20"
                        : hasGap
                          ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-500/30"
                          : "bg-card border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isRoot ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-foreground text-sm">{node.name}</h4>
                          <span className="text-2xs font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border">
                            {node.id}
                          </span>
                        </div>

                        <div className="mt-1 space-y-0.5 text-muted-foreground">
                          <p>
                            <span className="text-muted-foreground/70">Nascimento:</span>{" "}
                            {node.birthDate || (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                [Data Ausente]
                              </span>
                            )}
                            {node.birthPlace && ` • ${node.birthPlace}`}
                          </p>
                          {node.deathDate && (
                            <p>
                              <span className="text-muted-foreground/70">Falecimento:</span>{" "}
                              {node.deathDate}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasGap ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> Lacuna
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Completo
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setPersonId(node.id);
                          handleAudit(node.id);
                        }}
                        title="Tornar esta pessoa a raiz da auditoria"
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                      >
                        <Compass className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gaps / Action Recommendations (1 Col) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Lacunas Detectadas ({auditData.gaps.length})
            </h3>

            <div className="space-y-3">
              {auditData.gaps.map((gap) => {
                const surname = gap.personName.split(" ").pop() || "";
                return (
                  <div
                    key={gap.personId}
                    className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10 space-y-3 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{gap.personName}</span>
                      <span className="text-2xs font-mono text-muted-foreground">
                        {gap.personId}
                      </span>
                    </div>

                    <div>
                      <span className="text-2xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                        Dados Faltantes:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {gap.missingData.map((d) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-2xs font-semibold"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-muted-foreground text-2xs leading-relaxed border-t border-amber-200 dark:border-amber-500/20 pt-2">
                      <strong className="text-foreground">Ação Recomendada:</strong>{" "}
                      {gap.suggestedAction}
                    </p>

                    <a
                      href={`/search?surname=${encodeURIComponent(surname)}`}
                      className="inline-flex items-center justify-center gap-1 w-full py-2 rounded-lg bg-card hover:bg-muted/80 border border-border text-primary text-xs font-semibold transition-colors shadow-xs"
                    >
                      <FileSearch className="w-3.5 h-3.5" />
                      <span>Investigar Lacuna na Busca</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
