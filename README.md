# GENIA • Plataforma Genealógica Inteligente

[![Node.js](https://img.shields.io/badge/node->=24.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-12.6.0-orange.svg)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.6-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.3-38bdf8.svg)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-New_York-black.svg)](https://ui.shadcn.com/)
[![Biome](https://img.shields.io/badge/Biome-2.5.14-60a5fa.svg)](https://biomejs.dev/)

**GENIA** (referência a *Gênio*, *Genealogia* e *IA Gerativa*) é uma plataforma web autônoma e inteligente de pesquisa genealógica, auditoria de árvores familiares e decifração paleográfica multimodal integrada ao ecossistema do **FamilySearch**, com protocolo **Model Context Protocol (MCP)** e visão computacional via **Google Gemini Vision**.

A plataforma opera com base nos 5 critérios fundamentais do **Genealogical Proof Standard (GPS)**.

---

## 🌟 Funcionalidades Principais

1. **Busca Ativa & Paleografia Multimodal (`/search`):**
   - Pesquisa avançada na base indexada do FamilySearch com algoritmo fonético (Soundex / Levenshtein).
   - Decifração paleográfica via Gemini Vision de fólios paroquiais manuscritos em alta resolução (Russo Cirílico arcaico do Séc. XIX/XX, Romeno e Latim).
   - Caso de demonstração pré-configurado (*Caso Bessarábia - Colosovschi 1909*).

2. **Minha Árvore Genealógica Pedigree (`/my-tree`):**
   - Gráfico interativo nos padrões oficiais do FamilySearch cobrindo 3 a 4 gerações (Raiz, Cônjuge, Pais e 4 Avós).
   - Exibição de Tree IDs, datas vitais, marcadores de gênero e links diretos para o portal oficial.

3. **Auditoria & Detecção de Lacunas (`/audit`):**
   - Varredura algorítmica da árvore genealógica identificando buracos documentais (falta de data de nascimento, filiação ou fontes).
   - Cartões de alertas com ação recomendada e botão *"Investigar com o Agente"*.

4. **Diário de Pesquisa Auditável GPS (`/research-log`):**
   - Histórico probatório completo com status: *Verificado*, *Negativo*, *Em Andamento* e *Conflito*.
   - Exportação direta em **Markdown** formatado nos padrões acadêmicos do GPS.

5. **Servidor MCP Integrado (`/api/mcp`):**
   - Endpoint JSON expondo ferramentas genealógicas para agentes autônomos e clientes MCP compatíveis (`search_persons`, `get_tree_ancestors`, `get_dgs_waypoints`, `analyze_manuscript_image`).

6. **Autenticação Híbrida & Segura:**
   - Formulário de login modal (padrão shadcn `login-03` / `login-04`).
   - Persistência e renovação segura de Bearer Tokens e interceptação de sessão ativa.
   - Indicador de presença em tempo real (bolinha verde no canto superior direito do avatar).
   - Menu de perfil dinâmico com Nome, Usuário, crachá do Ambiente (`PRODUCTION`/`SANDBOX`) e modais para *Minha Conta*, *Status da Sessão* e *MCP Server*.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Versão |
| :--- | :--- | :--- |
| **Runtime & Pacotes** | Node.js / pnpm | Node `>=24.0.0` / pnpm `12.6.0` |
| **Framework Core** | Next.js (App Router, Turbopack) | `16.3.6` |
| **Biblioteca UI** | React | `19.3.0` |
| **Linguagem** | TypeScript | `^7.0.2` |
| **Estilização** | Tailwind CSS / PostCSS | `^4.3.3` |
| **Design System** | shadcn/ui (New York style) / Radix UI | Radix Primitives |
| **Temas** | next-themes (Light padrão / Dark) | `^0.4.4` |
| **Formulários & Schemas** | React Hook Form / Zod | `^7.54.2` / `^3.24.2` |
| **IA & Multimodalidade** | Google Gen AI SDK (Gemini 2.5 Flash / Vision) | `^2.24.0` |
| **Protocolo Agêntico** | Model Context Protocol SDK | `^1.31.0` |
| **Linter & Formatter** | Biome JS (zero ESLint / zero Prettier) | `2.5.14` |
| **Deploy Serverless** | Cloudflare Workers / OpenNext | `@opennextjs/cloudflare` |

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js versão `>=24.0.0`
- pnpm instalado globalmente (`npm install -g pnpm@12.6.0` ou via `corepack`)

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/seu-usuario/familysearch-agent.git
cd familysearch-agent
pnpm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e preencha suas credenciais:
```bash
cp .env.example .env
```
Campos essenciais no `.env`:
```env
# Google Gemini Vision
GEMINI_API_KEY=sua_chave_gemini_aqui

# FamilySearch API
FAMILYSEARCH_ENVIRONMENT=production
FAMILYSEARCH_SESSION_ID=seu_bearer_token_ativo
FAMILYSEARCH_USER_NAME=seu_usuario_familysearch

# Segurança de Sessão
SESSION_SECRET=chave_secreta_com_32_ou_mais_caracteres_hex
```

### 3. Executar o Servidor de Desenvolvimento
```bash
pnpm run dev
```
Acesse no seu navegador: **`http://localhost:3000`**

---

## 🧪 Comandos Úteis de Qualidade e Testes

```bash
# Executar a suíte de testes unitários (Node nativo)
pnpm test:unit

# Verificar formatação e regras de código com Biome
pnpm check

# Corrigir automaticamente problemas de lint e formatação
pnpm check:fix

# Gerar build de produção Next.js
pnpm run build

# Executar testes ponta a ponta com Playwright (opcional)
pnpm test:e2e
```

---

## 📁 Estrutura do Projeto (Clean Architecture)

```
familysearch/
├── docs/
│   └── ai/                   # Diretrizes técnicas para agentes de IA
│       ├── agents.md         # Persona e limites operacionais do agente
│       ├── rules.md          # Regras de código e estilo de engenharia
│       ├── skills.md         # Especificação das ferramentas MCP
│       ├── FAMILYSEARCH_API.md
│       └── changelog.md      # Histórico de versões e entregas
├── src/
│   ├── ai/                   # Integrações com LLM e Gemini Vision
│   │   ├── gemini/           # Cliente e prompts de transcrição paleográfica
│   │   └── mcp/              # Registro de ferramentas MCP
│   ├── app/                  # Rotas do Next.js App Router
│   │   ├── api/              # Route handlers (/api/mcp, /api/auth/*)
│   │   ├── audit/            # Tela de Auditoria de Árvore
│   │   ├── my-tree/          # Tela de Gráfico de Pedigree
│   │   ├── research-log/     # Tela do Diário GPS
│   │   ├── search/           # Tela de Busca Ativa & OCR
│   │   ├── globals.css       # Design tokens shadcn + Tailwind v4
│   │   └── page.tsx          # Página Inicial (Home)
│   ├── components/
│   │   ├── auth/             # Formulário de login (LoginForm)
│   │   ├── genea/            # Componentes genealógicos específicos
│   │   ├── layout/           # Header, navegação e menus
│   │   ├── theme/            # ThemeProvider (next-themes)
│   │   └── ui/               # Componentes base shadcn (Button, Dialog, etc.)
│   ├── lib/                  # Validação de env, utils e schemas Zod
│   ├── services/             # Comunicação externa (FamilySearch API, storage)
│   └── types/                # Definições de tipos TypeScript
├── tests/
│   └── unit/                 # Testes unitários (26 testes)
├── biome.json                # Configuração estrita do Biome
├── prompt-modelo.md          # Prompt mestre para replicação da plataforma
└── package.json
```

---

## 🎨 Diretrizes de Design & Temas

- **Branding:** Logotipo `GENIA` com `text-2xl font-black tracking-tight` uniforme entre `GEN` e `IA`, acompanhado do ícone `Network` virado para baixo (`rotate-180`).
- **Tema:** Suporte nativo a **Light** (padrão) e **Dark**, com alternância em 1 clique.
- **Tokens Semânticos:** Sempre utilize `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border` e `bg-background` para garantir contraste impecável em qualquer modo.
- **Presença do Usuário:** Bolinha verde de sessão ativa fixada na posição `top-0 right-0` do Avatar.
