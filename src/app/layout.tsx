import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { ThemeCustomizer } from "@/components/theme/ThemeCustomizer";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getCurrentUser } from "@/services/familysearch/user";
import { getSession } from "@/services/storage/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "GENIA • Plataforma Genealógica Inteligente",
  description:
    "Sistema Autônomo de Pesquisa Genealógica e Auditoria de Árvores Familiares com MCP e Gemini Vision",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const fsUser = session ? await getCurrentUser() : null;

  const userProfile = session
    ? {
        name: fsUser?.displayName || fsUser?.contactName || "Usuário FamilySearch",
        username: fsUser?.contactName
          ? `@${fsUser.contactName}`
          : fsUser?.displayName
            ? `@${fsUser.displayName.toLowerCase().replace(/\s+/g, "")}`
            : "@usuario",
        contactName: fsUser?.contactName,
        displayName: fsUser?.displayName,
        email: fsUser?.email,
        treeUserId: fsUser?.treeUserId || fsUser?.id || "",
      }
    : null;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-background text-foreground flex flex-col transition-colors">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Header user={userProfile} />
          <div className="flex-1">{children}</div>
          <ThemeCustomizer />
        </ThemeProvider>
      </body>
    </html>
  );
}
