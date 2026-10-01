"use client";

import {
  BookOpen,
  Compass,
  Cpu,
  History,
  KeyRound,
  LogIn,
  LogOut,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookmarkletModal } from "@/components/genea/BookmarkletModal";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: {
    displayName?: string;
    contactName?: string;
  } | null;
  isAuthenticated: boolean;
}

export function Navbar({ user, isAuthenticated }: NavbarProps) {
  const pathname = usePathname();
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Visão Geral", icon: Sparkles },
    { href: "/search", label: "Busca Ativa & OCR", icon: Search },
    { href: "/audit", label: "Auditoria de Árvore", icon: Compass },
    { href: "/research-log", label: "Diário GPS", icon: History },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-white">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              FamilySearch AI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "bg-slate-800 text-white font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/api/mcp"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Especificação das ferramentas MCP"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>MCP Protocol</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsBookmarkletOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold shadow-sm transition-all"
            title="Sincronizar com 1-clique via Favorito / Gmail SSO"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">1-Clique Gmail Sync</span>
            <span className="sm:hidden">Sync</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{user?.displayName || user?.contactName || "Conectado"}</span>
              </div>
              <Link
                href="/api/auth/logout"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Desconectar"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const token = window.prompt(
                    "Insira o seu SessionId ou Bearer Token do FamilySearch:",
                  );
                  if (token) {
                    const res = await fetch("/api/auth/token-login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ token: token.trim() }),
                    });
                    if (res.ok) {
                      window.location.reload();
                    } else {
                      alert("Falha ao autenticar com o token informado.");
                    }
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
                title="Conectar colando o SessionId do FamilySearch"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Colar Session Token</span>
              </button>
              <Link
                href="/api/auth/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Conectar FamilySearch</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      <BookmarkletModal isOpen={isBookmarkletOpen} onClose={() => setIsBookmarkletOpen(false)} />
    </nav>
  );
}
