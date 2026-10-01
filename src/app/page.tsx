import { BookOpen, Compass, Database, Network, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto flex flex-col gap-10 transition-colors">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Network className="w-3.5 h-3.5 rotate-180" /> GENIA v1.0
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> GPS Compliance
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            <span className="font-extrabold text-foreground">GEN</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400">IA</span>{" "}
            <span className="font-light text-muted-foreground">Plataforma</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-2">
            Orquestração autônoma com protocolo MCP, extração multimodal Gemini Vision e árvore
            genealógica sincronizada com o FamilySearch.
          </p>
        </div>
      </header>

      {/* Main Core Use Cases Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Active Search & Multimodal Paleography */}
        <Link
          href="/search"
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 transition-all hover:border-primary/50 hover:shadow-lg text-card-foreground"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-2">Busca Ativa & OCR</h2>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6">
            Inspeção automatizada de microfilmes históricos (DGS), waypoints paroquiais e decifração
            de manuscritos não indexados via Gemini Vision.
          </p>
          <div className="flex flex-wrap gap-2 text-2xs text-muted-foreground">
            <span className="px-2.5 py-1 bg-muted rounded-md border border-border">
              OCR Cirílico Séc. XIX
            </span>
            <span className="px-2.5 py-1 bg-muted rounded-md border border-border">
              Waypoints DGS
            </span>
          </div>
        </Link>

        {/* Card 2: Minha Árvore Pedigree */}
        <Link
          href="/my-tree"
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 transition-all hover:border-emerald-500/40 hover:shadow-lg text-card-foreground"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
            <Network className="w-6 h-6 rotate-180" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-2">
            Minha Árvore Familiar
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6">
            Navegação interativa do pedigree nos padrões oficiais do FamilySearch, exibindo
            ascendentes, cônjuges e identidades genealógicas.
          </p>
          <div className="flex flex-wrap gap-2 text-2xs text-muted-foreground">
            <span className="px-2.5 py-1 bg-muted rounded-md border border-border">
              Gráfico de Pedigree
            </span>
            <span className="px-2.5 py-1 bg-muted rounded-md border border-border">
              ID GYT8-36P
            </span>
          </div>
        </Link>

        {/* Card 3: Tree Audit & Gap Detection */}
        <Link
          href="/audit"
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 transition-all hover:border-purple-500/40 hover:shadow-lg text-card-foreground"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-2">Auditoria & Lacunas</h2>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6">
            Detecção algorítmica de lacunas na linhagem e sugestão automática de fontes paroquiais
            para validação e conformidade GPS.
          </p>
          <div className="flex flex-wrap gap-2 text-2xs text-muted-foreground">
            <span className="px-2.5 py-1 bg-muted rounded-md border border-border">
              GEDCOM X Sync
            </span>
            <span className="px-2.5 py-1 bg-muted rounded-md border border-border">
              Detecção de Buracos
            </span>
          </div>
        </Link>
      </section>

      {/* Live Case Study: Bessarábia / Colosovschi Case Status */}
      <section className="rounded-2xl border border-border bg-card p-6 md:p-8 text-card-foreground shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-lg text-foreground">
              Caso em Destaque: Linhagem Colosovschi (Beșghioz, 1909)
            </h3>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 self-start md:self-auto font-medium">
            DGS 005610797 • Processo 476
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-muted/40 p-4 rounded-xl border border-border">
            <span className="text-muted-foreground block mb-1">Indivíduo Alvo</span>
            <p className="font-semibold text-foreground text-sm">Iwan (João) Colosovschi</p>
            <p className="text-muted-foreground mt-1">Nascimento: 18/10/1909</p>
          </div>
          <div className="bg-muted/40 p-4 rounded-xl border border-border">
            <span className="text-muted-foreground block mb-1">Filiação</span>
            <p className="font-semibold text-foreground text-sm">Harlampe Colosovschi</p>
            <p className="text-muted-foreground mt-1">Mãe: Maria Terzi</p>
          </div>
          <div className="bg-muted/40 p-4 rounded-xl border border-border">
            <span className="text-muted-foreground block mb-1">Localização Arquivística</span>
            <p className="font-semibold text-foreground text-sm">Fundo 211, Opis 2, Дело 476</p>
            <p className="text-muted-foreground mt-1">Paróquia São Miguel Arcanjo</p>
          </div>
          <div className="bg-muted/40 p-4 rounded-xl border border-border">
            <span className="text-muted-foreground block mb-1">Status da Investigação</span>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
              Waypoints Mapeados
            </p>
            <p className="text-muted-foreground mt-1">Folhas 327–378 (Outubro 1909)</p>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="mt-auto pt-6 border-t border-border text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 FamilySearch Autonomous AI Agent • Clean Architecture</p>
        <p className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" /> Plataforma integrada com Cloudflare Workers & Google
          Gemini
        </p>
      </footer>
    </main>
  );
}
