"use client";

import {
  BookOpen,
  CheckCircle2,
  Copy,
  Eye,
  FileCheck2,
  FileText,
  Languages,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  Sliders,
  Sparkles,
  Sun,
  Upload,
  UserCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
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

  // Image manipulation state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Result Tabs
  const [activeTab, setActiveTab] = useState<"transcription" | "translation" | "entities">(
    "transcription",
  );

  // Save to GPS Log State
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [savedLogSuccess, setSavedLogSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setResult(null);
      setError(null);
      setSavedLogSuccess(false);
      resetImageControls();
    };
    reader.readAsDataURL(file);
  };

  const resetImageControls = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setInvert(false);
    setRotation(0);
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
Aos quinze dias do mês de abril de mil oitocentos e noventa e dois, nesta Igreja Matriz de Nossa Senhora da Conceição, batizei solenemente o infante Antônio, nascido a três do corrente mês, filho legítimo de Manuel de Albuquerque e de sua mulher Francisca de Almeida, ambos naturais desta comarca.
Foram padrinhos o capitão José da Silva e Maria do Carmo de Jesus. Para constar, lavrei este termo que subscrevo.
Padre Joaquim Vieira, Vigário Paroquial.`,
      translation: `Aos 15 de abril de 1892, na Igreja Matriz de Nossa Senhora da Conceição, foi solenemente batizado o recém-nascido Antônio, nascido em 3 de abril de 1892, filho legítimo de Manuel de Albuquerque e Francisca de Almeida. Padrinhos: Capitão José da Silva e Maria do Carmo de Jesus. Celebrante: Vigário Pe. Joaquim Vieira.`,
      extractedDetails: {
        recordType: "Batismo Paroquial",
        childName: "Antônio",
        fatherName: "Manuel de Albuquerque",
        motherName: "Francisca de Almeida",
        birthDate: "03/04/1892",
        baptismDate: "15/04/1892",
        place: "Paróquia Nossa Senhora da Conceição",
        witnesses: "Cap. José da Silva e Maria do Carmo de Jesus",
        official: "Padre Joaquim Vieira",
      },
      summary:
        "Assento paroquial de batismo original localizado e validado. Filiação comprovada com Manuel de Albuquerque e Francisca de Almeida. Padrinhos identificados.",
    });
    setError(null);
    setSavedLogSuccess(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setIsAnalyzing(true);
    setError(null);
    setSavedLogSuccess(false);

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
          },
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Erro ao analisar o manuscrito com Gemini Vision");
      }

      setResult(resData.result);
      if (resData.result?.translation) {
        setActiveTab("translation");
      } else {
        setActiveTab("transcription");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na análise visual";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToResearchLog = async () => {
    if (!result) return;
    setIsSavingLog(true);

    try {
      const res = await fetch("/api/research-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: villageName || "Cartório / Arquivo Diocesano",
          collection: result.extractedDetails.recordType || "Fólio Histórico Digitalizado",
          sourceReference: `Paleografia Vision - ${villageName || "Registro Histórico"} (${targetDate || "s/d"})`,
          searchedCriteria: {
            targetName:
              result.extractedDetails.childName || targetPerson || "Indivíduo em Investigação",
            variants: targetSurname ? [targetSurname] : [],
            dateRange: targetDate,
            location: villageName,
          },
          resultStatus: result.matchFound ? "verified" : "inconclusive",
          findings: result.summary,
          confidenceScore: result.confidenceScore,
          notes: `Transcrição Paleográfica:\n${result.transcription}\n\nFiliação: ${result.extractedDetails.fatherName || "N/D"} e ${result.extractedDetails.motherName || "N/D"}. Testemunhas: ${result.extractedDetails.witnesses || "N/D"}.`,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar no diário.");
      setSavedLogSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Falha ao salvar a transcrição no Diário de Pesquisa.");
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleCopyTranscription = () => {
    const textToCopy =
      activeTab === "translation" && result?.translation
        ? result.translation
        : result?.transcription || "";

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Estação Paleográfica & Decifrador Multimodal (Gemini Vision)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inspeção visual com zoom de alta resolução, inversão de microfilmes, transcrição
            diplomática e tradução para português
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSamplePage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors self-start cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" /> Carregar Demonstração Paleográfica
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Main Grid: Left Viewer & Controls, Right Transcript & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Canvas & Image Tuning Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Canvas Box */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: interactive pan zoom canvas */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`relative w-full h-[430px] rounded-xl border border-border bg-neutral-950 overflow-hidden flex items-center justify-center select-none ${
              zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            }`}
          >
            {imageBase64 ? (
              // biome-ignore lint/performance/noImgElement: dynamic user uploaded folio
              // biome-ignore lint/a11y/useAltText: interactive canvas
              <img
                src={imageBase64}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? "invert(1)" : ""}`,
                  transition: isDragging ? "none" : "transform 0.15s ease-out",
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
                draggable={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground text-xs gap-3">
                <Upload className="w-10 h-10 opacity-30 text-purple-400" />
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    Carregue um fólio ou página de microfilme
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Formatos JPG, PNG, WEBP suportados com resolução original mantida
                  </p>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Selecionar Imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Quick Canvas Overlay Controls */}
            {imageBase64 && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="bg-background/90 backdrop-blur-md border border-border/80 rounded-lg p-1 flex items-center gap-1 shadow-lg pointer-events-auto">
                  <button
                    type="button"
                    title="Diminuir Zoom"
                    onClick={() => setZoom((z) => Math.max(0.7, z - 0.25))}
                    className="p-1.5 hover:bg-muted rounded text-foreground transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1.5 text-muted-foreground">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    title="Aumentar Zoom"
                    onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                    className="p-1.5 hover:bg-muted rounded text-foreground transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-3.5 bg-border mx-0.5" />
                  <button
                    type="button"
                    title="Girar 90 Graus"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1.5 hover:bg-muted rounded text-foreground transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Ajustar à Tela"
                    onClick={resetImageControls}
                    className="p-1.5 hover:bg-muted rounded text-foreground transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-background/90 backdrop-blur-md border border-border/80 rounded-lg p-1 flex items-center gap-2 shadow-lg pointer-events-auto">
                  <label className="cursor-pointer text-[11px] font-medium text-foreground hover:text-primary px-2 py-1 rounded transition-colors flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Trocar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Image Processing Sliders (Negativo, Brilho, Contraste) */}
          {imageBase64 && (
            <div className="bg-card border border-border rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                  Tratamento de Imagem:
                </span>
              </div>

              <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="flex items-center gap-2 flex-1">
                  <Sun className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Brilho</span>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-primary h-1 bg-muted rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[10px] text-muted-foreground">Contraste</span>
                  <input
                    type="range"
                    min="50"
                    max="220"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-primary h-1 bg-muted rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInvert((inv) => !inv)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                    invert
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  Modo Negativo (DGS)
                </button>
                <button
                  type="button"
                  onClick={resetImageControls}
                  className="px-2 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Restaurar
                </button>
              </div>
            </div>
          )}

          {/* Form Context Fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-muted/20 p-3.5 rounded-xl border border-border text-xs">
            <div>
              <span className="block text-foreground font-medium mb-1 text-[11px]">
                Pessoa Procurada
              </span>
              <input
                value={targetPerson}
                placeholder="Ex: João, Ivan, Antonio"
                onChange={(e) => setTargetPerson(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <span className="block text-foreground font-medium mb-1 text-[11px]">Sobrenome</span>
              <input
                value={targetSurname}
                placeholder="Ex: Silva, Rossi, Müller"
                onChange={(e) => setTargetSurname(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <span className="block text-foreground font-medium mb-1 text-[11px]">
                Ano / Data Estimada
              </span>
              <input
                value={targetDate}
                placeholder="Ex: 1892 ou 15/04/1892"
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <span className="block text-foreground font-medium mb-1 text-[11px]">
                Paróquia / Município
              </span>
              <input
                value={villageName}
                placeholder="Ex: Matriz, Comuna, Cartório"
                onChange={(e) => setVillageName(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-xs placeholder:text-muted-foreground"
              />
            </div>

            <div className="col-span-2 sm:col-span-4 mt-1">
              <span className="block text-foreground font-medium mb-1 text-[11px]">
                Tradição Paleográfica / Idioma Original
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-input text-foreground text-xs cursor-pointer"
              >
                <option value="universal">Universal (Auto-detectar pelo Gemini Multimodal)</option>
                <option value="portuguese">
                  Português (Cartórios civis e paróquias brasileiras / portuguesas)
                </option>
                <option value="italian">
                  Italiano (Stato Civile / Atti di Nascita, Matrimonio, Morte)
                </option>
                <option value="spanish">Espanhol (Registros Parroquiales y Registro Civil)</option>
                <option value="latin">Latim Eclesiástico (Livros de Batismo e Matrimônio)</option>
                <option value="german">Alemão (Kurrent / Fraktur / Kirchenbücher)</option>
                <option value="french">Francês (Registres Paroissiaux et d'État Civil)</option>
                <option value="cyrillic_russian">
                  Russo Cirílico (Métricas Pré-Reforma / Revisões / Império Russo)
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
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemini Vision Transcrevendo e Traduzindo...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Executar Transcrição & Análise Multimodal</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Transcription, Translation & Structured Entities (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-muted/20 p-5 rounded-xl border border-border">
          {/* Header of results */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Parecer Paleográfico
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
                    <CheckCircle2 className="w-3.5 h-3.5" /> Identificado (
                    {Math.round(result.confidenceScore * 100)}%)
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> Sem Match Conclusivo
                  </>
                )}
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-4 text-xs flex-1 flex flex-col">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("transcription")}
                  className={`flex-1 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "transcription"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Original Diplomático</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("translation")}
                  className={`flex-1 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "translation"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Languages className="w-3 h-3 text-purple-500" />
                  <span>Tradução em Português</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("entities")}
                  className={`flex-1 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "entities"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserCheck className="w-3 h-3 text-emerald-500" />
                  <span>Entidades GPS</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1">
                {activeTab === "transcription" && (
                  <div className="relative">
                    <div className="bg-background p-4 rounded-xl border border-border font-mono text-[11px] text-foreground whitespace-pre-wrap leading-relaxed max-h-[290px] overflow-y-auto shadow-inner">
                      {result.transcription}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyTranscription}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-1 transition-colors border border-border cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedText ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                )}

                {activeTab === "translation" && (
                  <div className="relative">
                    <div className="bg-background p-4 rounded-xl border border-border text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-[290px] overflow-y-auto shadow-inner">
                      {result.translation || (
                        <span className="text-muted-foreground italic">
                          O texto original já se encontra em português ou não exigiu tradução em
                          língua estrangeira.
                        </span>
                      )}
                    </div>
                    {result.translation && (
                      <button
                        type="button"
                        onClick={handleCopyTranscription}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-1 transition-colors border border-border cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedText ? "Copiado!" : "Copiar"}</span>
                      </button>
                    )}
                  </div>
                )}

                {activeTab === "entities" && (
                  <div className="bg-background p-3.5 rounded-xl border border-border space-y-2.5 max-h-[290px] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Tipo de Assento
                        </span>
                        <span className="font-medium text-foreground">
                          {result.extractedDetails.recordType || "Registro Genealógico"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Data do Fato
                        </span>
                        <span className="font-medium text-foreground">
                          {result.extractedDetails.birthDate ||
                            result.extractedDetails.baptismDate ||
                            targetDate ||
                            "Não informada"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30 border border-border/50 col-span-2">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Indivíduo Principal
                        </span>
                        <span className="font-medium text-foreground">
                          {result.extractedDetails.childName ||
                            targetPerson ||
                            "Indivíduo identificado no termo"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30 border border-border/50 col-span-2">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Filiação Declarada
                        </span>
                        <span className="font-medium text-foreground">
                          {result.extractedDetails.fatherName
                            ? `Pai: ${result.extractedDetails.fatherName}`
                            : "Pai: Não citado"}
                          {" • "}
                          {result.extractedDetails.motherName
                            ? `Mãe: ${result.extractedDetails.motherName}`
                            : "Mãe: Não citada"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30 border border-border/50 col-span-2">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Testemunhas / Padrinhos
                        </span>
                        <span className="font-medium text-foreground">
                          {result.extractedDetails.witnesses || "Não discriminadas no fólio"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary card */}
              <div className="bg-card p-3 rounded-xl border border-border text-card-foreground">
                <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block mb-1">
                  Resumo Probatório GPS:
                </span>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {result.summary}
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveToResearchLog}
                  disabled={isSavingLog || savedLogSuccess}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {isSavingLog ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Gravando no Diário...</span>
                    </>
                  ) : savedLogSuccess ? (
                    <>
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Salvo no Diário GPS!</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Vincular ao Diário de Pesquisa</span>
                    </>
                  )}
                </button>

                {savedLogSuccess && (
                  <Link
                    href="/research-log"
                    className="w-full sm:w-auto px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium text-center border border-border transition-colors"
                  >
                    Ver no Diário →
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground text-xs">
              <Eye className="w-12 h-12 mb-3 opacity-30 text-purple-400" />
              <p className="font-medium text-foreground">Nenhum fólio processado</p>
              <p className="text-muted-foreground/70 mt-1 max-w-xs">
                Carregue uma imagem ou clique em &ldquo;Carregar Demonstração Paleográfica&rdquo;
                para testar a transcrição e tradução com IA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
