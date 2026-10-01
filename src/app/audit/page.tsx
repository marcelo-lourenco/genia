import { Compass, Sparkles } from "lucide-react";
import { TreeAuditView } from "@/components/genea/TreeAuditView";

export default function AuditPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-8 transition-colors">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Caso de Uso 2: Auditoria de Árvore Familiar
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground flex items-center gap-3 tracking-tight">
          <Compass className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          Auditoria & Detecção de Lacunas
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Explore sua árvore do FamilySearch, identifique buracos em gerações passadas e dispare
          rotinas automáticas de preenchimento documental
        </p>
      </div>

      <TreeAuditView />
    </main>
  );
}
