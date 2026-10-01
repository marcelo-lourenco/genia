import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
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
        name: fsUser?.displayName || fsUser?.contactName || "Marcelo Lourenço",
        username: "@MarceloLourenço6",
        contactName: fsUser?.contactName,
        displayName: fsUser?.displayName,
        email: fsUser?.email,
        treeUserId: fsUser?.treeUserId || fsUser?.id || "GYT8-36P",
      }
    : null;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-background text-foreground flex flex-col transition-colors">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Header user={userProfile} />
          <div className="flex-1">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
