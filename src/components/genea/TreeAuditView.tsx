"use client";

import { AlertTriangle, CheckCircle, ChevronRight, Compass, FileSearch, Users } from "lucide-react";
import { useState } from "react";
import type { TreeAncestryAuditResult } from "@/services/familysearch/tree";

interface TreeAuditViewProps {
  initialData?: TreeAncestryAuditResult;
}

export function TreeAuditView({ initialData }: TreeAuditViewProps) {
  const [personId, setPersonId] = useState("KWQS-BB1");
  const [generations, setGenerations] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [auditData, setAuditData] = useState<TreeAncestryAuditResult | null>(
    initialData || {
      rootPersonId: "KWQS-BB1",
      totalAncestorsFound: 4,
      generationsExplored: 4,
      ancestors: [
        {
          id: "KWQS-BB1",
          ahnenNumber: 1,
          name: "Iwan (João) Colosovschi",
          gender: "Male",
          birthDate: "18/10/1909",
          birthPlace: "Beșghioz, Bender, Bessarabia",
        },
        {
          id: "KWQS-BB2",
          ahnenNumber: 2,
          name: "Harlampe Colosovschi",
          gender: "Male",
          birthDate: "c. 1889",
          birthPlace: "Bessarabia",
        },
        {
          id: "KWQS-BB3",
          ahnenNumber: 3,
          name: "Maria Terzi",
          gender: "Female",
          birthDate: undefined, // GAP
          birthPlace: "Bessarabia",
        },
        {
          id: "KWQS-BB4",
          ahnenNumber: 4,
          name: "Ivan Colosovski",
          gender: "Male",
          birthDate: undefined, // GAP
          birthPlace: undefined, // GAP
        },
      ],
      gaps: [
        {
          personId: "KWQS-BB3",
          personName: "Maria Terzi",
          missingData: ["birthDate", "sources"],
          suggestedAction:
            "Buscar registros de batismo e casamento em Beșghioz para confirmar ano de nascimento e filiação.",
        },
        {
          personId: "KWQS-BB4",
          personName: "Ivan Colosovski",
          missingData: ["birthDate", "birthPlace", "sources"],
          suggestedAction:
            "Explorar livros de colonos ou censos da Bessarábia do final do Séc. XIX.",
        },
      ],
    },
  );

  const handleAudit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "get_tree_ancestors",
          arguments: { personId, generations },
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.result) {
        setAuditData(resData.result);
      }
    } catch (err) {
      console.error("Failed to run tree audit:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-card border border-border shadow-sm text-card-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label
              htmlFor="root-id"
              className="block text-2xs uppercase tracking-wider text-muted-foreground font-semibold mb-1"
            >
              ID da Pessoa Raiz
            </label>
            <input
              id="root-id"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-background border border-input text-xs text-foreground font-mono shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="gen-count"
              className="block text-2xs uppercase tracking-wider text-muted-foreground font-semibold mb-1"
            >
              Gerações
            </label>
            <select
              id="gen-count"
              value={generations}
              onChange={(e) => setGenerations(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-background border border-input text-xs text-foreground shadow-sm focus:ring-1 focus:ring-ring focus:outline-none cursor-pointer"
            >
              <option value={2}>2 Gerações</option>
              <option value={3}>3 Gerações</option>
              <option value={4}>4 Gerações</option>
              <option value={5}>5 Gerações</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAudit}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{isLoading ? "Auditando..." : "Rodar Auditoria"}</span>
        </button>
      </div>

      {auditData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ancestor Graph List (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Linhagem de Ancestrais Identificados ({auditData.ancestors.length})
            </h3>

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

                    <div>
                      {hasGap ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> Lacuna
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Completo
                        </span>
                      )}
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
              {auditData.gaps.map((gap) => (
                <div
                  key={gap.personId}
                  className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10 space-y-3 text-xs shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{gap.personName}</span>
                    <span className="text-2xs font-mono text-muted-foreground">{gap.personId}</span>
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
                    href={`/search?surname=${encodeURIComponent(gap.personName.split(" ").pop() || "")}`}
                    className="inline-flex items-center justify-center gap-1 w-full py-2 rounded-lg bg-card hover:bg-muted/80 border border-border text-primary text-xs font-semibold transition-colors shadow-xs"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>Investigar com o Agente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
