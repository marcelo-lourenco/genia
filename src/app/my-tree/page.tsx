"use client";

import { ExternalLink, Network, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface PersonNode {
  id: string;
  name: string;
  gender?: "MALE" | "FEMALE";
  lifespan?: string;
  birthDate?: string;
  birthPlace?: string;
  father?: PersonNode;
  mother?: PersonNode;
  spouse?: {
    id: string;
    name: string;
    lifespan?: string;
  };
}

export default function MyTreePage() {
  const [rootPerson, setRootPerson] = useState<PersonNode | null>(null);
  const [personId, setPersonId] = useState("");
  const [loading, setLoading] = useState(false);
  const [generations, setGenerations] = useState(3);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    treeUserId?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async (targetId: string, genCount: number) => {
    if (!targetId || targetId.trim().length < 3) {
      setError("Informe um Identificador (Person ID) válido do FamilySearch.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "get_tree_ancestors",
          arguments: {
            personId: targetId.trim().toUpperCase(),
            generations: genCount,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Não foi possível carregar a árvore para este ID");
      }

      const ancestors: Array<{
        id: string;
        ahnenNumber: number;
        name: string;
        gender?: string;
        lifespan?: string;
        birthDate?: string;
        birthPlace?: string;
      }> = data?.result?.ancestors || [];

      if (ancestors.length === 0) {
        setRootPerson(null);
        setError("Nenhum registro de ascendência retornado para este ID no FamilySearch.");
        return;
      }

      // Map dynamic nodes by Ahnen number (standard genealogical pedigree numbering)
      const root =
        ancestors.find((a) => a.ahnenNumber === 1 || a.id === targetId.toUpperCase()) ||
        ancestors[0];
      const father = ancestors.find((a) => a.ahnenNumber === 2);
      const mother = ancestors.find((a) => a.ahnenNumber === 3);
      const patGf = ancestors.find((a) => a.ahnenNumber === 4);
      const patGm = ancestors.find((a) => a.ahnenNumber === 5);
      const matGf = ancestors.find((a) => a.ahnenNumber === 6);
      const matGm = ancestors.find((a) => a.ahnenNumber === 7);

      const spouse = ancestors.find((a) => a.ascendancyNumber === "1-S" || a.ahnenNumber === -1);

      const treeData: PersonNode = {
        id: root.id,
        name: root.name,
        gender: root.gender?.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE",
        lifespan: root.lifespan,
        birthDate: root.birthDate,
        birthPlace: root.birthPlace,
        spouse: spouse
          ? {
              id: spouse.id,
              name: spouse.name,
              lifespan: spouse.lifespan,
            }
          : undefined,
        father: father
          ? {
              id: father.id,
              name: father.name,
              gender: "MALE",
              lifespan: father.lifespan,
              birthDate: father.birthDate,
              birthPlace: father.birthPlace,
              father: patGf
                ? {
                    id: patGf.id,
                    name: patGf.name,
                    gender: "MALE",
                    lifespan: patGf.lifespan,
                  }
                : undefined,
              mother: patGm
                ? {
                    id: patGm.id,
                    name: patGm.name,
                    gender: "FEMALE",
                    lifespan: patGm.lifespan,
                  }
                : undefined,
            }
          : undefined,
        mother: mother
          ? {
              id: mother.id,
              name: mother.name,
              gender: "FEMALE",
              lifespan: mother.lifespan,
              birthDate: mother.birthDate,
              birthPlace: mother.birthPlace,
              father: matGf
                ? {
                    id: matGf.id,
                    name: matGf.name,
                    gender: "MALE",
                    lifespan: matGf.lifespan,
                  }
                : undefined,
              mother: matGm
                ? {
                    id: matGm.id,
                    name: matGm.name,
                    gender: "FEMALE",
                    lifespan: matGm.lifespan,
                  }
                : undefined,
            }
          : undefined,
      };

      setRootPerson(treeData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar pedigree";
      setError(msg);
      setRootPerson(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Fetch current logged-in profile to get tree personId
  useEffect(() => {
    async function initUser() {
      try {
        const res = await fetch("/api/auth/profile");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUserProfile(data.user);
          const activeId = data.user.personId || data.user.treeUserId || data.user.id || "";
          if (activeId) {
            setPersonId(activeId);
            loadTree(activeId, generations);
          }
        }
      } catch {
        // Not logged in or offline
      }
    }
    initUser();
  }, [generations, loadTree]);

  const renderCard = (person?: PersonNode, role = "Pessoa", isRoot = false) => {
    if (!person) {
      return (
        <div className="flex h-24 w-64 flex-col justify-center rounded-xl border border-dashed border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
          <span>+ Adicionar {role}</span>
        </div>
      );
    }

    const isMale = person.gender === "MALE" || role.includes("Pai") || role.includes("Avô");

    return (
      <div
        className={`group relative flex w-64 flex-col justify-between rounded-xl border p-3.5 shadow-sm transition-all hover:shadow-md ${
          isRoot
            ? "border-primary bg-card ring-2 ring-primary/20 text-card-foreground"
            : "border-border bg-card text-card-foreground hover:border-primary/50"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isMale
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
              }`}
            >
              {isMale ? "♂" : "♀"}
            </div>
            <div className="overflow-hidden">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground block">
                {role}
              </span>
              <h4 className="text-xs font-bold text-foreground truncate">{person.name}</h4>
            </div>
          </div>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-2xs text-muted-foreground border border-border">
            {person.id}
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-2xs text-muted-foreground">
          <span>{person.lifespan || "Datas não registradas"}</span>
          <a
            href={`https://www.familysearch.org/tree/person/details/${person.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-0.5 text-primary hover:underline font-medium"
          >
            Ver <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-6 transition-colors">
      {/* Header da Árvore */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Network className="h-3 w-3 rotate-180" /> FamilySearch Pedigree Tree
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2 tracking-tight">
            Minha Árvore Familiar
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visualização de ascendência genealógica sincronizada em tempo real com o FamilySearch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {personId && (
            <a
              href={`https://www.familysearch.org/tree/pedigree/portrait/${personId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-xs"
            >
              Abrir no FamilySearch <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Barra de Controle Dinâmico da Árvore */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs text-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadTree(personId, generations);
          }}
          className="flex flex-1 items-center gap-2"
        >
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={personId}
              onChange={(e) => setPersonId(e.target.value.toUpperCase())}
              placeholder="Identificador FamilySearch (Ex: KWQS-BB1...)"
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
          >
            {loading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Network className="h-3.5 w-3.5 rotate-180" />
            )}
            Carregar Árvore
          </button>
        </form>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-2xs font-semibold text-muted-foreground uppercase">Gerações:</span>
          <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
            {[3, 4].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGenerations(g);
                  if (personId) loadTree(personId, g);
                }}
                className={`px-2.5 py-1 text-2xs font-semibold rounded-md transition-all cursor-pointer ${
                  generations === g
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {g} Gerações
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
          <span>{error}</span>
          {!userProfile && (
            <span className="text-2xs font-semibold underline cursor-pointer">
              Faça login no cabeçalho para carregar sua árvore pessoal
            </span>
          )}
        </div>
      )}

      {/* Visualização de Gráfico de Pedigree (Padrão FamilySearch) */}
      <div className="relative overflow-x-auto rounded-2xl border border-border bg-muted/20 p-6 md:p-10 shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span>Carregando árvore genealógica do FamilySearch...</span>
          </div>
        ) : !rootPerson ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Network className="h-6 w-6 rotate-180" />
            </div>
            <h3 className="text-base font-bold text-foreground">Nenhuma Árvore Carregada</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Conecte sua conta do FamilySearch pelo botão{" "}
              <strong className="text-foreground">"Entrar"</strong> no cabeçalho ou insira um
              Identificador (Person ID) acima para renderizar sua linhagem em tempo real.
            </p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-10 min-w-[850px] justify-start py-4">
            {/* Coluna 1: Raiz e Cônjuge */}
            <div className="flex flex-col gap-4 shrink-0">
              <div className="space-y-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-primary">
                  Geração 1 (Principal)
                </span>
                {renderCard(rootPerson || undefined, "Você", true)}
              </div>

              {rootPerson?.spouse && (
                <div className="space-y-1 pt-2">
                  <span className="text-2xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Cônjuge
                  </span>
                  <div className="flex w-64 flex-col justify-between rounded-xl border border-border bg-card p-3.5 shadow-sm text-card-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold">
                          ♀
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground block">
                            Esposa
                          </span>
                          <h4 className="text-xs font-bold text-foreground truncate">
                            {rootPerson.spouse.name}
                          </h4>
                        </div>
                      </div>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-2xs text-muted-foreground border border-border">
                        {rootPerson.spouse.id}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-2xs text-muted-foreground">
                      <span>{rootPerson.spouse.lifespan}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Casados
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Linha Conectora G1 -> G2 */}
            <div className="hidden md:flex flex-col justify-center items-center h-48 w-8 text-muted-foreground">
              <div className="w-px h-32 bg-border" />
            </div>

            {/* Coluna 2: Pais (Geração 2) */}
            <div className="flex flex-col justify-between gap-8 shrink-0">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Pai
                </span>
                {renderCard(rootPerson?.father, "Pai")}
              </div>

              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Mãe
                </span>
                {renderCard(rootPerson?.mother, "Mãe")}
              </div>
            </div>

            {/* Linha Conectora G2 -> G3 */}
            <div className="hidden md:flex flex-col justify-between h-72 w-8 text-muted-foreground py-6">
              <div className="w-px h-24 bg-border self-center" />
              <div className="w-px h-24 bg-border self-center" />
            </div>

            {/* Coluna 3: Avós (Geração 3) */}
            <div className="flex flex-col justify-between gap-4 shrink-0">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Avô Paterno
                </span>
                {renderCard(rootPerson?.father?.father, "Avô Paterno")}
              </div>

              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Avó Paterna
                </span>
                {renderCard(rootPerson?.father?.mother, "Avó Paterna")}
              </div>

              <div className="pt-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Avô Materno
                </span>
                {renderCard(rootPerson?.mother?.father, "Avô Materno")}
              </div>

              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Avó Materna
                </span>
                {renderCard(rootPerson?.mother?.mother, "Avó Materna")}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
