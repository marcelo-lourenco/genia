"use client";

import { AlertCircle, Loader2, Lock, Network, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  onSuccess?: (user: { name: string; username: string }) => void;
  onCancel?: () => void;
}

export function LoginForm({ onSuccess, onCancel }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Send login request to token-login / auth endpoint
      const res = await fetch("/api/auth/token-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: username,
          password: password,
          environment: "production",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Falha ao autenticar no FamilySearch");
      }

      // Fetch dynamic profile
      const profRes = await fetch("/api/auth/profile");
      const profData = await profRes.json();

      if (profData.authenticated && profData.user) {
        if (onSuccess) {
          onSuccess(profData.user);
        }
      } else {
        if (onSuccess) {
          onSuccess({
            name: username || "Usuário Conectado",
            username: username.startsWith("@") ? username : `@${username}`,
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao realizar login";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Brand & Heading */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <Network className="h-6 w-6 rotate-180" />
        </div>
        <div className="flex items-center mt-1">
          <span className="text-2xl font-black tracking-tight select-none inline-flex items-center">
            <span className="text-foreground">GEN</span>
            <span className="text-blue-600 dark:text-blue-400">IA</span>
          </span>
        </div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Acesse sua conta FamilySearch
        </h1>
        <p className="text-xs text-muted-foreground max-w-sm">
          Informe seu usuário e senha para conectar e sincronizar sua árvore genealógica em tempo
          real.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        <div className="grid gap-2">
          <Label htmlFor="username" className="text-xs font-semibold">
            Usuário ou E-mail
          </Label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              placeholder="Seu usuário ou e-mail"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="pl-9 text-xs"
            />
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold">
              Senha
            </Label>
            <a
              href="https://www.familysearch.org/pt/identity/recovery"
              target="_blank"
              rel="noreferrer"
              className="text-2xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Esqueceu a senha?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-9 text-xs"
            />
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full font-semibold mt-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Conectando ao FamilySearch...</span>
            </>
          ) : (
            <span>Entrar</span>
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="w-full text-xs text-muted-foreground hover:text-foreground -mt-1"
          >
            Cancelar
          </Button>
        )}
      </form>

      {/* Footer / Badge */}
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-center text-2xs text-muted-foreground flex items-center justify-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>Conexão criptografada oficial via FamilySearch Platform API</span>
      </div>
    </div>
  );
}
