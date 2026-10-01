import { History, ShieldCheck } from "lucide-react";
import { ResearchLogTable } from "@/components/genea/ResearchLogTable";

export default function ResearchLogPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-8 transition-colors">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Genealogical Proof Standard (GPS)
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground flex items-center gap-3 tracking-tight">
          <History className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          Diário de Pesquisa Auditável
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Histórico e trilha de auditoria completa de todas as buscas realizadas pelo agente,
          citações de fontes e correlações probatórias
        </p>
      </div>

      <ResearchLogTable />
    </main>
  );
}
