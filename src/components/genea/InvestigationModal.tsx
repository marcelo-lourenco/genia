"use client";

import {
  AlertCircle,
  Archive,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  Lightbulb,
  ListOrdered,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface InvestigationGap {
  personId: string;
  personName: string;
  missingData: string[];
  suggestedAction?: string;
}

interface InvestigationModalProps {
  gap: InvestigationGap | null;
  rootPersonName?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface InvestigationResult {
  personId: string;
  personName: string;
  hypothesis: string;
  primaryRepositories: string[];
  spellingVariants: string[];
  actionSteps: string[];
  gpsProofSummary: string;
  confidenceScore: number;
  logEntryId: string;
}

export function InvestigationModal({
  gap,
  rootPersonName,
  isOpen,
  onClose,
}: InvestigationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Trigger autonomous investigation when modal opens with a gap
  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger on open
  useEffect(() => {
    if (!isOpen || !gap) {
      setResult(null);
      setError(null);
      setCurrentStep(1);
      return;
    }

    let isMounted = true;

    async function runInvestigation() {
      setIsLoading(true);
      setError(null);
      setCurrentStep(1);

      // Advance visual steps to show reasoning progression
      const timer1 = setTimeout(() => isMounted && setCurrentStep(2), 700);
      const timer2 = setTimeout(() => isMounted && setCurrentStep(3), 1600);
      const timer3 = setTimeout(() => isMounted && setCurrentStep(4), 2600);

      try {
        const res = await fetch("/api/agent/investigate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personId: gap?.personId,
            personName: gap?.personName,
            missingData: gap?.missingData,
            suggestedAction: gap?.suggestedAction,
            rootPersonName,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Falha na investigação do agente.");
        }

        if (isMounted) {
          setCurrentStep(5);
          setResult(data.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Erro na investigação autônoma";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }

    runInvestigation();

    return () => {
      isMounted = false;
    };
  }, [isOpen, gap]);

  if (!gap) return null;

  const surname = gap.personName.split(" ").pop() || "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-card border-border">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <DialogTitle className="text-base font-bold text-foreground">
              Investigação Autônoma GPS • {gap.personName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            O agente de IA analisa as fontes arquivísticas, formula hipóteses segundo o Genealogical
            Proof Standard e registra no Diário.
          </DialogDescription>
        </DialogHeader>

        {/* Investigation Stepper */}
        <div className="my-2 p-3 bg-muted/30 rounded-xl border border-border">
          <div className="flex items-center justify-between text-2xs font-semibold text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" /> Linha de Raciocínio do Agente:
            </span>
            <span>{isLoading ? `Etapa ${currentStep} de 5...` : "Investigação Concluída"}</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-foreground">
              {currentStep >= 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span
                className={currentStep === 1 ? "font-bold text-primary" : "text-muted-foreground"}
              >
                1. Delimitação da lacuna ({gap.missingData.join(", ")}) e extração de contexto
              </span>
            </div>

            <div className="flex items-center gap-2 text-foreground">
              {currentStep >= 2 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span
                className={currentStep === 2 ? "font-bold text-primary" : "text-muted-foreground"}
              >
                2. Mapeamento de cartórios, paróquias e acervos competentes
              </span>
            </div>

            <div className="flex items-center gap-2 text-foreground">
              {currentStep >= 3 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span
                className={currentStep === 3 ? "font-bold text-primary" : "text-muted-foreground"}
              >
                3. Geração de variantes onomásticas e roteiro de busca em 3 passos
              </span>
            </div>

            <div className="flex items-center gap-2 text-foreground">
              {currentStep >= 4 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span
                className={currentStep === 4 ? "font-bold text-primary" : "text-muted-foreground"}
              >
                4. Síntese probatória GPS com cálculo de confiança
              </span>
            </div>

            <div className="flex items-center gap-2 text-foreground">
              {currentStep >= 5 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span
                className={
                  currentStep === 5
                    ? "font-bold text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }
              >
                5. Registro permanente gravado em /research-log
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-muted-foreground text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p>O agente está consultando diretrizes genealógicas e estruturando a prova...</p>
          </div>
        )}

        {/* Results View */}
        {result && (
          <div className="space-y-4 text-xs">
            {/* Hypothesis Card */}
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-foreground space-y-1">
              <span className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5" /> Hipótese Probatória GPS
              </span>
              <p className="text-muted-foreground leading-relaxed">{result.hypothesis}</p>
            </div>

            {/* Repositories & Variants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                  <Archive className="w-3.5 h-3.5 text-primary" /> Acervos & Repositórios-Alvo
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground text-[11px]">
                  {result.primaryRepositories.map((repo) => (
                    <li key={repo}>{repo}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                  <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Variantes Onomásticas
                  Mapeadas
                </span>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {result.spellingVariants.map((v) => (
                    <span
                      key={v}
                      className="px-2 py-0.5 rounded bg-background border border-border text-[11px] font-mono text-foreground"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Steps */}
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <ListOrdered className="w-3.5 h-3.5 text-emerald-500" /> Roteiro de Resolução em 3
                Passos
              </span>
              <ol className="space-y-1.5 pl-1">
                {result.actionSteps.map((step, idx) => (
                  <li
                    key={step}
                    className="flex items-start gap-2 text-muted-foreground text-[11px] leading-relaxed"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* GPS Summary Card */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Parecer Probatório Gravado no Diário
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                  Confiança: {Math.round(result.confidenceScore * 100)}%
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                {result.gpsProofSummary}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border">
              <Link
                href="/research-log"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Abrir Entrada no Diário GPS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <a
                  href={`/search?surname=${encodeURIComponent(surname)}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-card hover:bg-muted border border-border text-foreground font-medium text-xs transition-colors"
                >
                  <FileSearch className="w-3.5 h-3.5 text-primary" />
                  <span>Buscar Registros</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
