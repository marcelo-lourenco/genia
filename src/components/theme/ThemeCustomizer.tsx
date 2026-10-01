"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  CornerDownRight,
  Menu as MenuIcon,
  Minimize2,
  Palette,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  BaseColor,
  CustomThemeConfig,
  FontOption,
  MenuAccent,
  MenuStyle,
  RadiusOption,
  ThemeColor,
  ThemeStyle,
} from "@/types/theme";
import {
  applyThemeConfig,
  BASE_COLORS,
  DEFAULT_THEME_CONFIG,
  FONT_OPTIONS,
  generateCssSnippet,
  RADIUS_OPTIONS,
  THEME_COLORS,
} from "./theme-config";

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [config, setConfig] = useState<CustomThemeConfig>(DEFAULT_THEME_CONFIG);
  const [copied, setCopied] = useState(false);

  // Load from localStorage on mount and listen to trigger event
  useEffect(() => {
    try {
      const saved = localStorage.getItem("genia_theme_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        applyThemeConfig(parsed);
      } else {
        applyThemeConfig(DEFAULT_THEME_CONFIG);
      }
    } catch {
      applyThemeConfig(DEFAULT_THEME_CONFIG);
    }

    const handleOpen = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener("open-theme-customizer", handleOpen);
    return () => window.removeEventListener("open-theme-customizer", handleOpen);
  }, []);

  const updateConfig = (patch: Partial<CustomThemeConfig>) => {
    const updated = { ...config, ...patch };
    setConfig(updated);
    applyThemeConfig(updated);
  };

  const handleReset = () => {
    setConfig(DEFAULT_THEME_CONFIG);
    applyThemeConfig(DEFAULT_THEME_CONFIG);
  };

  const handleCopyCss = () => {
    const snippet = generateCssSnippet(config);
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Painel Flutuante SEM BACKDROP (permite ver a página mudar 100% ao vivo) */}
      {isOpen && (
        <aside
          className={`fixed top-20 right-4 sm:right-6 z-50 w-72 sm:w-80 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl flex flex-col text-card-foreground transition-all duration-200 select-none ${
            isMinimized ? "h-14 overflow-hidden" : "max-h-[calc(100vh-6.5rem)]"
          }`}
          style={{
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px hsl(var(--border))",
          }}
        >
          {/* Header do Menu (com botões de Minimizar e Fechar) */}
          <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-primary/10 text-primary">
                <Palette className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-foreground">Menu de Customização</h2>
                <p className="text-3xs text-muted-foreground">Tempo real • shadcn/ui</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title={isMinimized ? "Expandir Painel" : "Minimizar"}
              >
                {isMinimized ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveSection(null);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Fechar Painel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Lista de Opções Principais (Cards idênticos ao ui.shadcn.com/create) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                {/* 1. Style */}
                <div className="rounded-xl border border-border bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === "style" ? null : "style")}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <span className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground block">
                        Style
                      </span>
                      <span className="font-bold text-foreground capitalize">{config.style}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-xs border border-foreground/40 flex items-center justify-center text-muted-foreground" />
                      {activeSection === "style" ? (
                        <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {activeSection === "style" && (
                    <div className="p-2 pt-1 grid grid-cols-2 gap-1.5 border-t border-border mt-1">
                      {(["nova", "default", "new-york", "compact"] as ThemeStyle[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateConfig({ style: s })}
                          className={`py-1.5 px-2 rounded-md text-2xs font-medium capitalize text-left transition-colors cursor-pointer ${
                            config.style === s
                              ? "bg-primary text-primary-foreground font-bold"
                              : "bg-background hover:bg-muted text-foreground border border-border"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Base Color */}
                <div className="rounded-xl border border-border bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(activeSection === "baseColor" ? null : "baseColor")
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <span className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground block">
                        Base Color
                      </span>
                      <span className="font-bold text-foreground capitalize">
                        {BASE_COLORS[config.baseColor]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-border shadow-xs shrink-0"
                        style={{ backgroundColor: BASE_COLORS[config.baseColor]?.previewHex }}
                      />
                      {activeSection === "baseColor" ? (
                        <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {activeSection === "baseColor" && (
                    <div className="p-2 pt-1 grid grid-cols-2 gap-1.5 border-t border-border mt-1">
                      {(Object.keys(BASE_COLORS) as BaseColor[]).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updateConfig({ baseColor: b })}
                          className={`py-1.5 px-2 rounded-md text-2xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                            config.baseColor === b
                              ? "bg-primary text-primary-foreground font-bold"
                              : "bg-background hover:bg-muted text-foreground border border-border"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: BASE_COLORS[b].previewHex }}
                          />
                          <span>{BASE_COLORS[b].label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Theme (Primary Color Accent) */}
                <div className="rounded-xl border border-border bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(activeSection === "themeColor" ? null : "themeColor")
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <span className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground block">
                        Theme
                      </span>
                      <span className="font-bold text-foreground capitalize">
                        {THEME_COLORS[config.themeColor]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-border shadow-xs shrink-0"
                        style={{ backgroundColor: THEME_COLORS[config.themeColor]?.previewHex }}
                      />
                      {activeSection === "themeColor" ? (
                        <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {activeSection === "themeColor" && (
                    <div className="p-2 pt-1 grid grid-cols-2 gap-1.5 border-t border-border mt-1">
                      {(Object.keys(THEME_COLORS) as ThemeColor[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateConfig({ themeColor: c, chartColor: c })}
                          className={`py-1.5 px-2 rounded-md text-2xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                            config.themeColor === c
                              ? "bg-primary text-primary-foreground font-bold"
                              : "bg-background hover:bg-muted text-foreground border border-border"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: THEME_COLORS[c].previewHex }}
                          />
                          <span>{THEME_COLORS[c].label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Chart Color */}
                <div className="rounded-xl border border-border bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(activeSection === "chartColor" ? null : "chartColor")
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <span className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground block">
                        Chart Color
                      </span>
                      <span className="font-bold text-foreground capitalize">
                        {THEME_COLORS[config.chartColor]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-border shadow-xs shrink-0"
                        style={{ backgroundColor: THEME_COLORS[config.chartColor]?.previewHex }}
                      />
                      {activeSection === "chartColor" ? (
                        <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {activeSection === "chartColor" && (
                    <div className="p-2 pt-1 grid grid-cols-2 gap-1.5 border-t border-border mt-1">
                      {(Object.keys(THEME_COLORS) as ThemeColor[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateConfig({ chartColor: c })}
                          className={`py-1.5 px-2 rounded-md text-2xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                            config.chartColor === c
                              ? "bg-primary text-primary-foreground font-bold"
                              : "bg-background hover:bg-muted text-foreground border border-border"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: THEME_COLORS[c].previewHex }}
                          />
                          <span>{THEME_COLORS[c].label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Heading Font */}
                <div className="rounded-xl border border-border bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(activeSection === "headingFont" ? null : "headingFont")
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <span className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground block">
                        Heading
                      </span>
                      <span className="font-bold text-foreground">
                        {FONT_OPTIONS[config.headingFont]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground text-xs font-serif">Aa</span>
                      {activeSection === "headingFont" ? (
                        <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {activeSection === "headingFont" && (
                    <div className="p-2 pt-1 space-y-1 border-t border-border mt-1">
                      {(Object.keys(FONT_OPTIONS) as FontOption[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => updateConfig({ headingFont: f })}
                          className={`w-full py-1.5 px-2 rounded-md text-2xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            config.headingFont === f
                              ? "bg-primary text-primary-foreground font-bold"
                              : "bg-background hover:bg-muted text-foreground border border-border"
                          }`}
                        >
                          <span style={{ fontFamily: FONT_OPTIONS[f].family }}>
                            {FONT_OPTIONS[f].label}
                          </span>
                          <span className="opacity-70 text-3xs font-serif">Aa</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. Body Font */}
                <div className="rounded-xl border border-border bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(activeSection === "bodyFont" ? null : "bodyFont")
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <span className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground block">
                        Font
                      </span>
                      <span className="font-bold text-foreground">
                        {FONT_OPTIONS[config.bodyFont]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground text-xs">Aa</span>
                      {activeSection === "bodyFont" ? (
                        <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {activeSection === "bodyFont" && (
                    <div className="p-2 pt-1 space-y-1 border-t border-border mt-1">
                      {(Object.keys(FONT_OPTIONS) as FontOption[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => updateConfig({ bodyFont: f })}
                          className={`w-full py-1.5 px-2 rounded-md text-2xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            config.bodyFont === f
                              ? "bg-primary text-primary-foreground font-bold"
                              : "bg-background hover:bg-muted text-foreground border border-border"
                          }`}
                        >
                          <span style={{ fontFamily: FONT_OPTIONS[f].family }}>
                            {FONT_OPTIONS[f].label}
                          </span>
                          <span className="opacity-70 text-3xs">Aa</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 7. Icon Library */}
                <div className="rounded-xl border border-border bg-muted/30 p-1">
                  <div className="flex items-center justify-between p-2">
                    <div>
                      <span className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground block">
                        Icon Library
                      </span>
                      <span className="font-bold text-foreground">Lucide React</span>
                    </div>
                    <MenuIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>

                {/* 8. Radius */}
                <div className="rounded-xl border border-border bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === "radius" ? null : "radius")}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <span className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground block">
                        Radius
                      </span>
                      <span className="font-bold text-foreground">
                        {RADIUS_OPTIONS[config.radius]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground" />
                      {activeSection === "radius" ? (
                        <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {activeSection === "radius" && (
                    <div className="p-2 pt-1 grid grid-cols-3 gap-1.5 border-t border-border mt-1">
                      {(["0", "0.3", "0.5", "0.75", "1.0"] as RadiusOption[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updateConfig({ radius: r })}
                          className={`py-1.5 px-2 rounded-md text-2xs font-medium text-center transition-colors cursor-pointer ${
                            config.radius === r
                              ? "bg-primary text-primary-foreground font-bold"
                              : "bg-background hover:bg-muted text-foreground border border-border"
                          }`}
                        >
                          {RADIUS_OPTIONS[r]?.label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 9. Menu & Menu Accent */}
                <div className="rounded-xl border border-border bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === "menu" ? null : "menu")}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <span className="text-3xs uppercase tracking-wider font-semibold text-muted-foreground block">
                        Menu Style
                      </span>
                      <span className="font-bold text-foreground capitalize">
                        {config.menuStyle} / {config.menuAccent}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {activeSection === "menu" && (
                    <div className="p-2 pt-1 space-y-2 border-t border-border mt-1">
                      <div>
                        <span className="text-3xs text-muted-foreground font-semibold block mb-1">
                          Preenchimento
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(["default", "solid"] as MenuStyle[]).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => updateConfig({ menuStyle: m })}
                              className={`py-1 px-2 rounded-md text-2xs capitalize transition-colors cursor-pointer ${
                                config.menuStyle === m
                                  ? "bg-primary text-primary-foreground font-bold"
                                  : "bg-background hover:bg-muted text-foreground border border-border"
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-3xs text-muted-foreground font-semibold block mb-1">
                          Realce de Acento
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(["subtle", "bold"] as MenuAccent[]).map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => updateConfig({ menuAccent: a })}
                              className={`py-1 px-2 rounded-md text-2xs capitalize transition-colors cursor-pointer ${
                                config.menuAccent === a
                                  ? "bg-primary text-primary-foreground font-bold"
                                  : "bg-background hover:bg-muted text-foreground border border-border"
                              }`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé com Ações (Copiar CSS e Restaurar) */}
              <div className="p-3 border-t border-border bg-muted/20 space-y-1.5">
                <button
                  type="button"
                  onClick={handleCopyCss}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Variáveis CSS Copiadas!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Código CSS (shadcn)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-1.5 py-1 rounded-lg text-muted-foreground hover:text-foreground text-2xs font-semibold hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
}
