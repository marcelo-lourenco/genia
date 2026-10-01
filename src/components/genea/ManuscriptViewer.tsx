"use client";

import { CheckCircle2, Eye, FileText, Loader2, Sparkles, Upload, XCircle } from "lucide-react";
import { useState } from "react";
import type { ManuscriptAnalysisResult } from "@/ai/gemini/vision";

export function ManuscriptViewer() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("universal");
  const [targetPerson, setTargetPerson] = useState("");
  const [targetSurname, setTargetSurname] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [villageName, setVillageName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ManuscriptAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSamplePage = () => {
    setImageBase64(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    );
    setTargetPerson("Antônio");
    setTargetSurname("Albuquerque");
    setTargetDate("15/04/1892");
    setVillageName("Paróquia Nossa Senhora da Conceição");
    setLanguage("portuguese");
    setResult({
      matchFound: true,
      confidenceScore: 0.95,
      transcription: `[Registro Paroquial de Batismo, Livro 14, Folha 88, Assento 42]
Aos quinze dias do mês de abril de mil oitocentos e noventa e dois, nesta Igreja Matriz de Nossa Senhora da Conceição, batizei solenemente o infante Antônio, nascido a três do corrente mês, filho legítimo de Manuel de Albuquerque e de sua mulher Francisca de Almeida.
Foram padrinhos o capitão José da Silva e Maria do Carmo. Para constar, lavrei este termo.
O Vigário Paroquial.`,
      extractedDetails: {
        childName: "Antônio",
        fatherName: "Manuel de Albuquerque",
        motherName: "Francisca de Almeida",
        birthDate: "03/04/1892",
        baptismDate: "15/04/1892",
      },
      summary:
        "Assento paroquial de batismo devidamente localizado e transcrito. Filiação confirmada: Manuel de Albuquerque e Francisca de Almeida. Data do ato: 15/04/1892.",
    });
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "analyze_manuscript_image",
          arguments: {
            imageBase64,
            language,
            targetPerson,
            targetSurname,
            targetDate,
            villageName,
            year: "1909",
          },
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Erro ao analisar o manuscrito com Gemini Vision");
      }

      setResult(resData.result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na análise visual";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Visualizador e Decifrador Paleográfico (Gemini Vision)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inspeção visual de fólios históricos, transcrição de cirílico arcaico e validação de
            assentos
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSamplePage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors self-start cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" /> Carregar Registro Exemplo
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Inputs / Upload row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Image Upload & Preview */}
        <div className="flex flex-col gap-4">
          <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-muted/20 text-center">
            {imageBase64 ? (
              <div className="relative w-full max-h-72 overflow-hidden rounded-lg border border-border flex items-center justify-center bg-muted/40">
                {/* biome-ignore lint/a11y/useAltText: preview */}
                {/* biome-ignore lint/performance/noImgElement: user upload preview */}
                <img src={imageBase64} className="max-h-72 object-contain" />
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    Selecione uma imagem de fólio paroquial ou registro civil
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Formatos suportados: JPG, PNG, WEBP (qualquer resolução)
                  </p>
                </div>
              </>
            )}

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium transition-colors border border-border">
              <Upload className="w-3.5 h-3.5" />
              <span>{imageBase64 ? "Trocar Imagem" : "Carregar Arquivo"}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Context tuning */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-4 rounded-xl border border-border">
            <div>
              <span className="block text-foreground font-medium mb-1">Pessoa Procurada</span>
              <input
                value={targetPerson}
                placeholder="Ex: João, Giovanni, Ivan..."
                onChange={(e) => setTargetPerson(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <span className="block text-foreground font-medium mb-1">Sobrenome</span>
              <input
                value={targetSurname}
                placeholder="Ex: Silva, Rossi, Müller..."
                onChange={(e) => setTargetSurname(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <span className="block text-foreground font-medium mb-1">Data / Ano Estimado</span>
              <input
                value={targetDate}
                placeholder="Ex: 1892 ou 15/04/1892"
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <span className="block text-foreground font-medium mb-1">Paróquia / Município</span>
              <input
                value={villageName}
                placeholder="Ex: Paróquia Matriz, Comuna..."
                onChange={(e) => setVillageName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground"
              />
            </div>
            <div className="col-span-2">
              <span className="block text-foreground font-medium mb-1">
                Idioma / Tradição Paleográfica
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-input text-foreground text-xs cursor-pointer"
              >
                <option value="universal">Universal (Auto-detectar pelo Gemini)</option>
                <option value="portuguese">
                  Português (Cartórios civis e paróquias brasileiras/portuguesas)
                </option>
                <option value="italian">
                  Italiano (Stato Civile / Atti di Nascita, Matrimonio, Morte)
                </option>
                <option value="spanish">Espanhol (Registros Parroquiales y Registro Civil)</option>
                <option value="latin">Latim Eclesiástico (Livros de Batismo e Matrimônio)</option>
                <option value="german">Alemão (Kurrent / Fraktur / Kirchenbücher)</option>
                <option value="french">Francês (Registres Paroissiaux et d'État Civil)</option>
                <option value="cyrillic_russian">
                  Russo Cirílico (Métricas Pré-Reforma / Revisões)
                </option>
                <option value="romanian">Romeno / Moldavo</option>
                <option value="polish">Polonês (Akta Stanu Cywilnego)</option>
                <option value="hebrew">Hebraico / Iídiche</option>
                <option value="english">Inglês Antigo / Britânico / Americano</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!imageBase64 || isAnalyzing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemini Vision Decifrando Manuscrito...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Executar Transcrição & Análise Multimodal</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Live Transcription & Findings */}
        <div className="flex flex-col gap-4 bg-muted/20 p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resultado da Paleografia
            </h4>
            {result && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  result.matchFound
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                {result.matchFound ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correspondência Identificada (
                    {Math.round(result.confidenceScore * 100)}%)
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> Sem Correspondência Clara
                  </>
                )}
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-4 text-xs">
              <div className="bg-background p-4 rounded-lg border border-border font-mono text-foreground whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto shadow-inner">
                {result.transcription}
              </div>

              <div className="bg-card p-3 rounded-lg border border-border text-card-foreground">
                <span className="font-semibold text-foreground block mb-1">
                  Resumo para o Diário GPS:
                </span>
                <p className="text-muted-foreground leading-relaxed">{result.summary}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground text-xs">
              <Eye className="w-10 h-10 mb-3 opacity-40" />
              <p>Nenhuma imagem submetida para análise paleográfica ainda.</p>
              <p className="text-muted-foreground/70 mt-1">
                Carregue um fólio ou utilize a demonstração.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
