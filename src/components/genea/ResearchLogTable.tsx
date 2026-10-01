"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { ResearchLogEntry, ResearchStatus } from "@/types/agent";

const mockLogEntries: ResearchLogEntry[] = [
  {
    id: "log-1",
    timestamp: "2026-10-01 00:08",
    repository: "Arquivo Nacional da Moldávia (ANRM)",
    collection: "Moldova, Church Books, 1811-1936",
    sourceReference: "Fundo 211, Opis 2, Processo 476, Beșghioz (Sf. Mihail), Folha 342, Imagem 68",
    searchedCriteria: {
      targetName: "Иван (Iwan/Ivan)",
      variants: ["Colosovschi", "Colosovski", "Колосовский"],
      dateRange: "Outubro de 1909 (18/10/1909)",
      location: "Beșghioz, Bender",
    },
    resultStatus: "verified",
    findings:
      "Assento de batismo nº 68 localizado. Data de nascimento: 05/10/1909 (Juliano) = 18/10/1909 (Gregoriano). Pais: Harlampe (filho de Ivan) e Maria. Padrinhos: Gheorghe Terzi.",
    confidenceScore: 0.96,
    notes: "Conformidade total com a tradição familiar e registros brasileiros.",
  },
  {
    id: "log-2",
    timestamp: "2026-10-01 00:04",
    repository: "FamilySearch Digital Library",
    collection: "Bender Uezd Metrical Records 1909",
    sourceReference: "DGS 005610797, Item 2 de 3, Processo 445",
    searchedCriteria: {
      targetName: "Iwan Colosovschi",
      variants: ["Colosovski"],
      location: "Distrito de Bender",
    },
    resultStatus: "negative",
    findings:
      "Exame das folhas do Processo 445 não contém a paróquia de Beșghioz. Identificado que Beșghioz pertence ao Processo 476 (Item 3).",
    confidenceScore: 1.0,
    notes: "Resultado negativo orientou o redirecionamento para o Item 3 / Processo 476.",
  },
  {
    id: "log-3",
    timestamp: "2026-09-30 23:45",
    repository: "Hospedaria de Imigrantes de São Paulo",
    collection: "Livros de Registro da Hospedaria do Brás",
    sourceReference: "Livro 114, Página 82, Ordem 14.520",
    searchedCriteria: {
      targetName: "Harlampe Colosovschi",
      variants: ["Colosovski", "Harlangal"],
      dateRange: "Janeiro de 1926",
      location: "Porto de Santos / Vapor Arlanza",
    },
    resultStatus: "verified",
    findings:
      "Chegada registrada em 31/01/1926 no navio Arlanza. Família composta por Harlampe (37 anos), Maria (34 anos) e filhos incluindo Iwan (16 anos).",
    confidenceScore: 0.98,
    notes: "Confirmação da data e navio da imigração familiar.",
  },
];

export function ResearchLogTable() {
  const [entries, _setEntries] = useState<ResearchLogEntry[]>(mockLogEntries);
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

        <button
          type="button"
          onClick={handleExportMarkdown}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold border border-border transition-colors self-start sm:self-auto cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Diário (Markdown GPS)</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card text-card-foreground shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider text-2xs">
              <tr>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Fonte / Repositório</th>
                <th className="py-3.5 px-4">Critérios de Busca</th>
                <th className="py-3.5 px-4">Status & Confiança</th>
                <th className="py-3.5 px-4">Achados & Evidências</th>
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
                    <p className="font-bold text-foreground">{entry.searchedCriteria.targetName}</p>
                    <p className="text-muted-foreground text-2xs">
                      {entry.searchedCriteria.variants.join(", ")}
                    </p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
