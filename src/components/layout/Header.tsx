"use client";

import {
  Check,
  Clock,
  Copy,
  Cpu,
  ExternalLink,
  GitFork,
  LogIn,
  LogOut,
  Moon,
  Network,
  ShieldCheck,
  Sliders,
  Sun,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface UserProfile {
  name: string;
  username: string;
  email?: string;
  treeUserId?: string;
  contactName?: string;
  avatarUrl?: string;
}

interface HeaderProps {
  user?: UserProfile | null;
  onLogout?: () => void;
}

export function Header({ user: initialUser, onLogout }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialUser || null);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showFullToken, setShowFullToken] = useState(false);

  // Active Session info
  const [sessionDetails, setSessionDetails] = useState<{
    environment: string;
    tokenMasked: string;
    rawToken: string;
  }>({
    environment: "production",
    tokenMasked: "p0-7_3u8...0a1",
    rawToken: "p0-7_3u8UAEByP.6C5OFaak0a1",
  });

  useEffect(() => {
    setMounted(true);

    // Fetch dynamic profile & session from /api/auth/profile
    async function fetchProfile() {
      try {
        const res = await fetch("/api/auth/profile");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.session) {
            setSessionDetails(data.session);
          }
        }
      } catch {
        // use fallback if offline
      }
    }

    fetchProfile();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "ML";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout");
    } catch {
      // ignore
    }
    setCurrentUser(null);
    if (onLogout) {
      onLogout();
    }
    router.refresh();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(sessionDetails.rawToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-md sticky top-0 z-50 transition-colors text-foreground">
      {/* 1 e 2: Marca GENIA com ícone Network invertido */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Ícone Network virado para baixo (rotate-180 para representar ascendência) */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Network className="h-5 w-5 rotate-180" />
          </div>

          {/* Nome da plataforma GENIA com espaçamento perfeitamente uniforme entre GEN e IA */}
          <span className="text-2xl font-black tracking-tight select-none inline-flex items-center">
            <span className="text-foreground">GEN</span>
            <span className="text-blue-600 dark:text-blue-400">IA</span>
          </span>
        </Link>

        {/* Links Principais de Navegação */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Link
            href="/search"
            className="rounded-lg px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Busca Ativa & OCR
          </Link>
          <Link
            href="/my-tree"
            className="rounded-lg px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Minha Árvore
          </Link>
          <Link
            href="/audit"
            className="rounded-lg px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Auditoria de Árvore
          </Link>
          <Link
            href="/research-log"
            className="rounded-lg px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Diário GPS
          </Link>
        </nav>
      </div>

      {/* Menu Superior Direito */}
      <div className="flex items-center justify-end gap-3">
        {/* 8: Botão de Tema Rápido (1 clique) */}
        {mounted && (
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            title={theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>
        )}

        {currentUser ? (
          <DropdownMenu>
            {/* 3: Gatilho Avatar com indicador visual verde (logado) */}
            <DropdownMenuTrigger className="rounded-full border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 cursor-pointer">
              <div className="relative inline-flex items-center justify-center">
                <Avatar className="h-9 w-9 transition-transform hover:scale-105 ring-2 ring-blue-500/30">
                  {currentUser.avatarUrl ? (
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Bolinha verde indicando status logado/ativo no canto superior direito */}
                <span
                  className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-xs"
                  title="Conectado ao FamilySearch"
                />
              </div>
            </DropdownMenuTrigger>

            {/* Menu Alinhado à Direita */}
            <DropdownMenuContent
              align="end"
              className="w-64 p-1.5 border-border bg-popover text-popover-foreground shadow-xl"
            >
              {/* DropdownMenuLabel exibindo Nome em negrito, Usuário e Ambiente */}
              <DropdownMenuLabel className="flex flex-col space-y-1.5 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground leading-tight truncate">
                    {currentUser.name}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-3xs font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {sessionDetails.environment}
                  </span>
                </div>
                <span className="text-2xs font-normal text-muted-foreground truncate">
                  {currentUser.username}
                </span>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-border" />

              {/* 4: Minha Conta */}
              <DropdownMenuItem
                onClick={() => setIsAccountOpen(true)}
                className="cursor-pointer gap-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
              >
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Minha Conta</span>
              </DropdownMenuItem>

              {/* 5: Minha Árvore */}
              <DropdownMenuItem
                asChild
                className="cursor-pointer gap-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
              >
                <Link href="/my-tree">
                  <GitFork className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Minha Árvore</span>
                </Link>
              </DropdownMenuItem>

              {/* 6: Sessão */}
              <DropdownMenuItem
                onClick={() => setIsSessionOpen(true)}
                className="cursor-pointer gap-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Sessão</span>
              </DropdownMenuItem>

              {/* 7: MCP Server */}
              <DropdownMenuItem
                onClick={() => setIsMcpOpen(true)}
                className="cursor-pointer gap-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
              >
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                <span>MCP Server</span>
              </DropdownMenuItem>

              {/* Personalizar UI */}
              <DropdownMenuItem
                onClick={() => window.dispatchEvent(new CustomEvent("open-theme-customizer"))}
                className="cursor-pointer gap-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
              >
                <Sliders className="h-3.5 w-3.5 text-primary" />
                <span>Personalizar UI</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              {/* 8: Alternar Tema */}
              <DropdownMenuItem
                onClick={toggleTheme}
                className="cursor-pointer gap-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Tema Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-slate-600" />
                    <span>Tema Escuro</span>
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              {/* Log out */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5 text-destructive" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={() => setIsLoginOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 transition-all cursor-pointer"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Entrar no GENIA</span>
          </button>
        )}
      </div>

      {/* MODAL LOGIN (shadcn Dialog com LoginForm padrão login-03/login-04) */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-md p-6 border-border bg-card text-card-foreground">
          <LoginForm
            onSuccess={(user) => {
              setCurrentUser(user);
              setIsLoginOpen(false);
              router.refresh();
            }}
            onCancel={() => setIsLoginOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 4: MODAL MINHA CONTA (shadcn Dialog - Apenas Leitura) */}
      <Dialog open={isAccountOpen} onOpenChange={setIsAccountOpen}>
        <DialogContent className="max-w-md p-6 border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-blue-600" />
              Dados do Perfil FamilySearch
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Informações oficiais do perfil vinculado no FamilySearch (somente leitura).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-3 text-xs">
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2.5">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground text-2xs uppercase tracking-wider font-semibold">
                  Nome
                </span>
                <span className="font-bold text-foreground">
                  {currentUser?.name || "Marcelo Lourenço"}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground text-2xs uppercase tracking-wider font-semibold">
                  Usuário
                </span>
                <span className="font-mono text-muted-foreground">
                  {currentUser?.username || "@MarceloLourenço6"}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground text-2xs uppercase tracking-wider font-semibold">
                  Identificador (Tree ID)
                </span>
                <span className="font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-2xs font-semibold">
                  {currentUser?.treeUserId || "GYT8-36P"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-2xs uppercase tracking-wider font-semibold">
                  Status da Conta
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-2xs">
                  <ShieldCheck className="h-3 w-3" /> Verificada & Ativa
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <a
                href="https://www.familysearch.org/pt/identity/settings/profile"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Gerenciar no FamilySearch <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => setIsAccountOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6: MODAL SESSÃO (shadcn Dialog - Apenas Leitura) */}
      <Dialog open={isSessionOpen} onOpenChange={setIsSessionOpen}>
        <DialogContent className="max-w-md p-6 border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-emerald-500" />
              Status da Sessão FamilySearch
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Dados da conexão criptografada ativa com a API do FamilySearch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-3 text-xs">
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2.5">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground text-2xs uppercase tracking-wider font-semibold">
                  Status
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado (200 OK)
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground text-2xs uppercase tracking-wider font-semibold">
                  Ambiente
                </span>
                <span className="uppercase font-mono text-2xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-semibold">
                  {sessionDetails.environment}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-2xs uppercase tracking-wider font-semibold">
                    Bearer Token / Session ID
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFullToken(!showFullToken)}
                    className="text-2xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showFullToken ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={showFullToken ? sessionDetails.rawToken : sessionDetails.tokenMasked}
                    className="w-full font-mono text-2xs bg-background border border-input rounded px-2.5 py-1.5 text-foreground"
                  ></input>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    title="Copiar Token"
                  >
                    {copiedToken ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSessionOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 7: MODAL MCP SERVER (shadcn Dialog) */}
      <Dialog open={isMcpOpen} onOpenChange={setIsMcpOpen}>
        <DialogContent className="max-w-md p-6 border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Cpu className="h-4 w-4 text-purple-500" />
              Model Context Protocol (MCP) Server
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Servidor MCP ativo integrado ao ecossistema FamilySearch e Gemini Vision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-3 text-xs">
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground text-2xs uppercase font-semibold">
                  Protocolo
                </span>
                <span className="font-mono text-2xs font-bold text-purple-600 dark:text-purple-400">
                  mcp-1.0
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground text-2xs uppercase font-semibold">
                  Rota Ativa
                </span>
                <a
                  href="/api/mcp"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-2xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  /api/mcp <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>

              <span className="text-muted-foreground text-2xs uppercase font-semibold block pt-1">
                Ferramentas Genealógicas Registradas:
              </span>
              <ul className="space-y-1 font-mono text-2xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  search_persons (Busca indexada FamilySearch)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  get_tree_ancestors (Auditoria e árvore genealógica)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  get_dgs_waypoints (Waypoints DGS de microfilmes)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  analyze_manuscript_image (OCR Gemini Vision)
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <a
                href="/api/mcp"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Abrir Rota JSON <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => setIsMcpOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
