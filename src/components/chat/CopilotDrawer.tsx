"use client";

import {
  Bot,
  Check,
  Copy,
  ImageIcon,
  Lightbulb,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: string;
}

const QUICK_SUGGESTIONS = [
  "Como superar uma linhagem interrompida (brick wall)?",
  "O que significa o Padrão de Prova Genealógica (GPS)?",
  "Como localizar certidões de batismo ou casamento em Portugal?",
  "Dicas para interpretar termos em latim paroquial",
  "Como achar a certidão de desembarque de imigrantes?",
];

export function CopilotDrawer() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [sendOnEnter, setSendOnEnter] = useState<boolean>(false);
  const [authProfile, setAuthProfile] = useState<{
    authenticated: boolean;
    user?: { name: string; username: string; personId?: string };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/profile");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setAuthProfile(data);
          setMessages([
            {
              id: "welcome-auth",
              role: "assistant",
              content: `Olá, **${data.user.name || "Pesquisador"}**! Sou o **GENIA Copilot**, conectado diretamente à sua conta do **FamilySearch**.\n\nTenho acesso total à sua árvore, fontes e registros. Analiso documentos e livros arquivísticos sozinho e sem repassar trabalho para você folhear. Você pode me passar qualquer ID (como \`${data.user.personId || "GYT8-36P"}\` ou de seus ancestrais) ou colar prints/documentos aqui para análise visual direta.\n\nQual caso gostaria que eu examinasse agora?`,
              timestamp: "Agora",
            },
          ]);
        }
      } catch {
        // offline fallback
      }
    }
    loadProfile();
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Olá! Sou o **GENIA Copilot**, seu assistente genealógico com inteligência artificial conectado à sua conta do **FamilySearch**.\n\nTenho acesso direto à sua árvore, fontes anexadas e acervos históricos. Eu analiso os documentos e cruzo evidências sozinho. Você pode me enviar qualquer ID de antepassado (como `GYT8-1CB`), colar prints de telas/certidões com **Ctrl+V** ou pedir análises probatórias segundo o **GPS**.\n\nComo posso ajudar na sua pesquisa hoje?",
      timestamp: "Agora",
    },
  ]);

  // Auto-scroll on new message
  // biome-ignore lint/correctness/useExhaustiveDependencies: auto-scroll on change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Keyboard shortcut: Ctrl+J or Cmd+J to toggle Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle clipboard image paste (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setAttachedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Handle file select through attachment button
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input.trim();
    if ((!textToSend && !attachedImage) || isLoading) return;

    const currentAttachedImage = attachedImage;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: textToSend || "(Print/Imagem anexada para análise visual)",
      image: currentAttachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          attachedImage: currentAttachedImage || undefined,
          context: {
            currentPath: pathname,
            personId: authProfile?.user?.personId,
            personName: authProfile?.user?.name,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao consultar o copiloto.");
      }

      const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro de conexão";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Não foi possível obter resposta no momento: ${errorMsg}. Por favor, tente novamente em instantes.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Histórico limpo. Como posso apoiar sua investigação genealógica agora?",
        timestamp: "Agora",
      },
    ]);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format basic markdown (bold, lists, code)
  const renderFormattedContent = (content: string) => {
    return (
      <div className="space-y-2 leading-relaxed">
        {content.split("\n\n").map((paragraph, pIdx) => {
          // If line is a bullet list
          if (paragraph.startsWith("- ") || paragraph.startsWith("* ")) {
            const items = paragraph.split("\n");
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: paragraph index
              <ul key={pIdx} className="list-disc pl-4 space-y-1 my-1">
                {items.map((item, iIdx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: item index
                  <li key={iIdx}>{item.replace(/^[-*]\s+/, "")}</li>
                ))}
              </ul>
            );
          }

          // If numbered list
          if (/^\d+\.\s/.test(paragraph)) {
            const items = paragraph.split("\n");
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: paragraph index
              <ol key={pIdx} className="list-decimal pl-4 space-y-1 my-1">
                {items.map((item, iIdx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: item index
                  <li key={iIdx}>{item.replace(/^\d+\.\s+/, "")}</li>
                ))}
              </ol>
            );
          }

          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: paragraph index
            <p key={pIdx} className="whitespace-pre-wrap">
              {paragraph}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Toggle Button (Always accessible) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-primary/20"
          >
            <Sparkles className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
            <span>Copiloto IA</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] rounded bg-black/20 text-white/80 font-mono">
              Ctrl+J
            </kbd>
          </button>
        </div>
      )}

      {/* Slide-over Drawer */}
      {isOpen && (
        <aside
          aria-label="GENIA Copilot Chat"
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        >
          {/* Top Bar */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-card/60 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-foreground">GENIA Copilot</h3>
                  {authProfile?.authenticated ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      FamilySearch Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                      GPS AI
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Contexto: <span className="font-mono text-foreground">{pathname}</span>
                  {authProfile?.user?.personId && (
                    <span className="ml-1 text-muted-foreground/80">
                      • Raiz:{" "}
                      <span className="font-mono text-primary">{authProfile.user.personId}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Limpar histórico"
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Fechar (Ctrl+J)"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-purple-600/10 border border-purple-600/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-xs"
                      : "bg-muted/50 border border-border text-foreground rounded-tl-xs"
                  }`}
                >
                  {/* Attached image thumbnail in user message */}
                  {msg.image && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/20 max-w-[260px] bg-black/30">
                      {/* biome-ignore lint/performance/noImgElement: user chat screenshot */}
                      {/* biome-ignore lint/a11y/useAltText: user chat screenshot */}
                      <img src={msg.image} className="max-h-48 object-contain w-full" />
                    </div>
                  )}

                  {renderFormattedContent(msg.content)}

                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/80 pt-1 border-t border-border/30">
                    <span>{msg.timestamp}</span>

                    {msg.role === "assistant" && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-foreground flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">Copiar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center text-muted-foreground text-xs p-2">
                <div className="w-7 h-7 rounded-full bg-purple-600/10 border border-purple-600/20 flex items-center justify-center text-purple-600 dark:text-purple-400 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2 bg-muted/40 border border-border px-3 py-2 rounded-xl">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>GENIA Copilot examinando registros e imagens...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="p-3 border-t border-border bg-card/40 space-y-2">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>Sugestões rápidas de pesquisa:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {QUICK_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSendMessage(sug)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border text-[11px] transition-colors cursor-pointer shrink-0"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Attached Image Preview Banner */}
          {attachedImage && (
            <div className="px-3 py-2 border-t border-border bg-muted/50 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* biome-ignore lint/performance/noImgElement: user upload preview */}
                {/* biome-ignore lint/a11y/useAltText: preview */}
                <img
                  src={attachedImage}
                  className="w-10 h-10 object-cover rounded-lg border border-border shadow-xs shrink-0 bg-background"
                />
                <div className="min-w-0 text-2xs">
                  <span className="font-semibold text-foreground flex items-center gap-1 truncate">
                    <ImageIcon className="w-3 h-3 text-primary" /> Print / Imagem Anexada
                  </span>
                  <span className="text-muted-foreground text-[10px] block truncate">
                    O Copilot analisará o conteúdo visual com IA
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                title="Remover anexo"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Box with Textarea, Paste support, Attachment Icon & Enter Config */}
          <div className="p-3 border-t border-border bg-card">
            {/* Input Action Controls (Attachment, Paste Hint & Enter Config) */}
            <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Anexar print ou imagem de documento"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-medium">Anexar Print</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="text-muted-foreground/30">•</span>
                <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
                  Cole prints com Ctrl+V
                </span>
              </div>

              {/* Enter sending configuration */}
              <label
                className="flex items-center gap-1.5 cursor-pointer text-[10px] select-none text-muted-foreground hover:text-foreground transition-colors"
                title={
                  sendOnEnter
                    ? "Enter envia a mensagem. Use Shift+Enter para nova linha."
                    : "Enter quebra linha. Pressione Ctrl+Enter ou clique no botão para enviar."
                }
              >
                <input
                  type="checkbox"
                  checked={sendOnEnter}
                  onChange={(e) => setSendOnEnter(e.target.checked)}
                  className="rounded border-border accent-primary cursor-pointer w-3 h-3"
                />
                <span>Enviar com Enter</span>
              </label>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (sendOnEnter && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    } else if (!sendOnEnter && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }
                }}
                rows={2}
                placeholder={
                  sendOnEnter
                    ? "Escreva sua dúvida ou cole prints com Ctrl+V... (Enter envia, Shift+Enter pula linha)"
                    : "Escreva sua dúvida ou cole prints com Ctrl+V... (Enter pula linha, Ctrl+Enter envia)"
                }
                disabled={isLoading}
                className="flex-1 px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />

              <button
                type="submit"
                disabled={(!input.trim() && !attachedImage) || isLoading}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-sm cursor-pointer shrink-0"
                title={sendOnEnter ? "Enviar mensagem (Enter)" : "Enviar mensagem (Ctrl+Enter)"}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </aside>
      )}
    </>
  );
}
