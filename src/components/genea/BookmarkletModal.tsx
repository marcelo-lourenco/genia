"use client";

import { Bookmark, Check, Copy, ExternalLink, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const BOOKMARKLET_CODE = `javascript:(function(){if(!location.hostname.includes('familysearch.org')){alert('Abra este favorito enquanto estiver logado no familysearch.org!');return;}fetch('/service/ident/session/sessions/CURRENT',{headers:{'Accept':'application/session-v1+json'}}).then(function(r){return r.json();}).then(function(data){if(!data||!data.sessionId){alert('Sessão ativa não encontrada no FamilySearch. Faça login primeiro no familysearch.org.');return;}location.href='http://localhost:3000/api/auth/token-login?token='+encodeURIComponent(data.sessionId);}).catch(function(err){alert('Erro ao resgatar sessão do FamilySearch: '+err);});})();`;

interface BookmarkletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarkletModal({ isOpen, onClose }: BookmarkletModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Set href directly on the DOM element to bypass React 19's javascript: URL protection
    if (linkRef.current && isOpen) {
      linkRef.current.setAttribute("href", BOOKMARKLET_CODE);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(BOOKMARKLET_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/auth/token-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: manualToken.trim() }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        setSubmitError("Token inválido ou não autorizado pelo FamilySearch.");
      }
    } catch {
      setSubmitError("Erro ao comunicar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Sincronizar Sessão FamilySearch</h3>
              <p className="text-xs text-slate-400">Compatível com login Google (Gmail SSO)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-4 text-xs text-slate-300">
          {/* Método 1: Favorito de 1-Clique */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2.5">
            <span className="text-2xs text-emerald-400 uppercase tracking-wider block font-bold">
              Método 1: 1-Clique no Navegador (Mais Rápido)
            </span>
            <p className="text-2xs text-slate-400">
              Arraste o botão abaixo para a sua barra de favoritos do navegador:
            </p>

            {/* Draggable Bookmarklet Link - Bypass React with direct DOM attribute */}
            <a
              ref={linkRef}
              href="#bookmarklet"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-grab active:cursor-grabbing select-none"
              title="Arraste para os favoritos do seu navegador"
            >
              <Bookmark className="w-4 h-4" />
              <span>⚡ Sincronizar com Agente IA</span>
            </a>

            <p className="text-2xs text-slate-500">
              Depois, basta abrir a aba do{" "}
              <a
                href="https://www.familysearch.org"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
              >
                FamilySearch.org <ExternalLink className="w-2.5 h-2.5" />
              </a>{" "}
              e clicar no favorito.
            </p>
          </div>

          {/* Método 2: Colar Manualmente */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 text-xs">
                Método 2: Ou cole seu SessionId diretamente
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copiar código do bookmarklet para criar favorito manual"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copied ? "Copiado!" : "Copiar Código"}</span>
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Cole aqui seu sessionId ou cookie fssessionid..."
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !manualToken.trim()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs transition-colors shrink-0"
                >
                  {isSubmitting ? "Conectando..." : "Conectar"}
                </button>
              </div>
              {submitError && <p className="text-rose-400 text-2xs font-medium">{submitError}</p>}
            </form>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
