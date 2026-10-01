"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  HelpCircle,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResearchLogEntry, ResearchStatus } from "@/types/agent";

export function ResearchLogTable() {
  const [entries, setEntries] = useState<ResearchLogEntry[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New entry form state
  const [newRepository, setNewRepository] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [newSourceReference, setNewSourceReference] = useState("");
  const [newTargetName, setNewTargetName] = useState("");
  const [newVariants, setNewVariants] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDateRange, setNewDateRange] = useState("");
  const [newResultStatus, setNewResultStatus] = useState<ResearchStatus>("verified");
  const [newFindings, setNewFindings] = useState("");
  const [newConfidence, setNewConfidence] = useState("95");
  const [newNotes, setNewNotes] = useState("");

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/research-log");
      const data = await res.json();
      if (data.success && data.entries) {
        setEntries(data.entries);
      }
    } catch (err) {
      console.error("Failed to load research log:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initial load on mount
  useEffect(() => {
    loadEntries();
  }, []);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetName.trim() || !newFindings.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        repository: newRepository || "FamilySearch Digital Library",
        collection: newCollection || "Registros Históricos Gerais",
        sourceReference: newSourceReference || "Citação documental pendente",
        searchedCriteria: {
          targetName: newTargetName.trim(),
          variants: newVariants
            ? newVariants
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            : [],
          location: newLocation.trim() || undefined,
          dateRange: newDateRange.trim() || undefined,
        },
        resultStatus: newResultStatus,
        findings: newFindings.trim(),
        confidenceScore: (Number(newConfidence) || 90) / 100,
        notes: newNotes.trim() || undefined,
      };

      const res = await fetch("/api/research-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.entries) {
        setEntries(data.entries);
        setIsDialogOpen(false);
        // Reset form
        setNewRepository("");
        setNewCollection("");
        setNewSourceReference("");
        setNewTargetName("");
        setNewVariants("");
        setNewLocation("");
        setNewDateRange("");
        setNewFindings("");
        setNewNotes("");
      }
    } catch (err) {
      console.error("Failed to create log entry:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Deseja realmente remover esta entrada do diário de pesquisa?")) return;
    try {
      const res = await fetch(`/api/research-log?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success && data.entries) {
        setEntries(data.entries);
      }
    } catch (err) {
      console.error("Failed to delete log entry:", err);
    }
  };

  const filtered = entries.filter((e) => filterStatus === "all" || e.resultStatus === filterStatus);

  const getStatusBadge = (status: ResearchStatus) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Verificado
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3" /> Em Andamento
          </span>
        );
      case "negative":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-muted text-muted-foreground border border-border">
            <XCircle className="w-3 h-3" /> Negativo
          </span>
        );
      case "conflict":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" /> Conflito
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-muted text-muted-foreground">
            <HelpCircle className="w-3 h-3" /> Pendente
          </span>
        );
    }
  };

  const handleExportMarkdown = () => {
    const lines = [
      "# Diário de Pesquisa Genealógica (Genealogical Proof Standard - GPS)",
      `Gerado em: ${new Date().toISOString()}\n`,
      "| Data | Repositório / Fonte | Critérios | Status | Conclusão e Evidências | Confiança |",
      "|---|---|---|---|---|---|",
    ];

    for (const e of entries) {
      lines.push(
        `| ${e.timestamp} | ${e.repository} (${e.sourceReference}) | ${e.searchedCriteria.targetName} | ${e.resultStatus} | ${e.findings} | ${Math.round(e.confidenceScore * 100)}% |`,
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `research_log_gps_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-sm text-card-foreground">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-foreground font-semibold">Filtrar por Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring shadow-xs cursor-pointer"
          >
            <option value="all">Todos os Registros</option>
            <option value="verified">Verificado</option>
            <option value="in_progress">Em Andamento</option>
            <option value="negative">Negativo</option>
            <option value="conflict">Conflito</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Modal para Adicionar Novo Registro */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground">
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Registro no Log</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateEntry}>
                <DialogHeader>
                  <DialogTitle>Registrar Investigação no Diário GPS</DialogTitle>
                  <DialogDescription>
                    Adicione um novo registro documental com citação de fontes e evidências
                    probatórias.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
                  <div>
                    <Label htmlFor="log-target-name">Pessoa Pesquisada *</Label>
                    <Input
                      id="log-target-name"
                      required
                      value={newTargetName}
                      onChange={(e) => setNewTargetName(e.target.value)}
                      placeholder="Ex: João Ferreira da Costa"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="log-variants">
                      Variantes de Grafia (separadas por vírgula)
                    </Label>
                    <Input
                      id="log-variants"
                      value={newVariants}
                      onChange={(e) => setNewVariants(e.target.value)}
                      placeholder="Ex: Ferreira, Ferreyra, Costa"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="log-repo">Repositório / Arquivo</Label>
                    <Input
                      id="log-repo"
                      value={newRepository}
                      onChange={(e) => setNewRepository(e.target.value)}
                      placeholder="Ex: FamilySearch, Cartório de Registro Civil..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="log-collection">Coleção / Fundo</Label>
                    <Input
                      id="log-collection"
                      value={newCollection}
                      onChange={(e) => setNewCollection(e.target.value)}
                      placeholder="Ex: Brasil, São Paulo, Registros Paroquiais"
                      className="mt-1"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="log-source">
                      Citação da Fonte / Referência (DGS / Folha / Livro)
                    </Label>
                    <Input
                      id="log-source"
                      value={newSourceReference}
                      onChange={(e) => setNewSourceReference(e.target.value)}
                      placeholder="Ex: Livro 28, Folha 142, Assento 68 / DGS 005610797"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="log-location">Localidade</Label>
                    <Input
                      id="log-location"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="Ex: Campinas, São Paulo"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="log-date">Data ou Período</Label>
                    <Input
                      id="log-date"
                      value={newDateRange}
                      onChange={(e) => setNewDateRange(e.target.value)}
                      placeholder="Ex: Outubro de 1898"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="log-status">Status Probatório</Label>
                    <select
                      id="log-status"
                      value={newResultStatus}
                      onChange={(e) => setNewResultStatus(e.target.value as ResearchStatus)}
                      className="w-full mt-1 px-3 py-2 rounded-md bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="verified">Verificado (Conclusão Positiva)</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="negative">Negativo (Não localizado nesta fonte)</option>
                      <option value="conflict">Conflito de Informações</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="log-conf">Confiança Probatória (%)</Label>
                    <Input
                      id="log-conf"
                      type="number"
                      min={0}
                      max={100}
                      value={newConfidence}
                      onChange={(e) => setNewConfidence(e.target.value)}
                      placeholder="95"
                      className="mt-1"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="log-findings">Achados, Evidências e Transcrição *</Label>
                    <textarea
                      id="log-findings"
                      required
                      rows={3}
                      value={newFindings}
                      onChange={(e) => setNewFindings(e.target.value)}
                      placeholder="Descreva os fatos comprovados pela fonte, filiação encontrada, datas..."
                      className="w-full mt-1 px-3 py-2 rounded-md bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="log-notes">Observações Adicionais</Label>
                    <Input
                      id="log-notes"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Ex: Registros congruentes com os relatos orais..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Registro"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold border border-border transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar GPS (Markdown)</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card text-card-foreground shadow-sm">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Carregando diário de pesquisa...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider text-2xs">
                <tr>
                  <th className="py-3.5 px-4">Data / Hora</th>
                  <th className="py-3.5 px-4">Fonte / Repositório</th>
                  <th className="py-3.5 px-4">Critérios de Busca</th>
                  <th className="py-3.5 px-4">Status & Confiança</th>
                  <th className="py-3.5 px-4">Achados & Evidências</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground font-mono text-2xs">
                      {entry.timestamp}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-foreground">{entry.repository}</p>
                      <p className="text-muted-foreground text-2xs mt-0.5 font-mono">
                        {entry.sourceReference}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-foreground">
                        {entry.searchedCriteria.targetName}
                      </p>
                      {entry.searchedCriteria.variants.length > 0 && (
                        <p className="text-muted-foreground text-2xs">
                          {entry.searchedCriteria.variants.join(", ")}
                        </p>
                      )}
                      {entry.searchedCriteria.location && (
                        <p className="text-muted-foreground/80 text-2xs">
                          {entry.searchedCriteria.location}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getStatusBadge(entry.resultStatus)}
                        <p className="text-2xs text-muted-foreground font-mono">
                          Confiança: {Math.round(entry.confidenceScore * 100)}%
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="leading-relaxed text-foreground">{entry.findings}</p>
                      {entry.notes && (
                        <p className="text-muted-foreground text-2xs mt-1 italic">
                          Obs: {entry.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Excluir entrada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
