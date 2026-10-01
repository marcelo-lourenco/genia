# Plano de Implementação: Agente de IA para Pesquisa Genealógica no FamilySearch

**Projeto:** Sistema Autônomo de Pesquisa Genealógica e Auditoria de Árvores Familiares  
**Integrações Centrais:** FamilySearch API (REST / GEDCOM X), Model Context Protocol (MCP), Google Gemini (Multimodal / Vision)  
**Gerenciador de Pacotes:** `pnpm@12.6.0` | **Runtime:** Node.js `>=24.21.0`  
**Deploy Alvo:** Cloudflare Workers/Pages via `@opennextjs/cloudflare` + `wrangler`  

---

## 1. Visão Arquitetural e Princípios

O sistema adota os princípios de **Clean Architecture / Arquitetura Hexagonal**, garantindo desacoplamento estrito entre as regras de negócio genealógicas, a orquestração do agente de IA e os adaptadores de infraestrutura externa (FamilySearch API, Cloudflare, Web Scraping e LLM).

```mermaid
graph TD
    UI[Next.js App Router UI] --> AI_Orch[Orquestrador do Agente de IA / MCP]
    AI_Orch --> Gemini[Gemini Multimodal / Vision OCR]
    AI_Orch --> MCP_Tools[Ferramentas MCP / FamilySearch Client]
    MCP_Tools --> FS_API[FamilySearch REST API / GEDCOM X]
    MCP_Tools --> Scraper[Headless Automation / Fallback DGS]
    FS_API --> TokenManager[OAuth2 Token & Session Manager]
    TokenManager --> Security[Cloudflare Secrets / .env Blindado]
```

### Pilares Fundamentais:
1. **Segurança Zero-Hardcoding:** Credenciais OAuth2, Gemini Keys e tokens ficam estritamente no servidor (Server Actions / Route Handlers) alimentados por variáveis de ambiente validadas por schema Zod.
2. **Padrão de Dados GEDCOM X:** Todo fluxo de dados de pessoas, relacionamentos, fontes e eventos métricos é tipado e mapeado para a especificação GEDCOM X.
3. **Resiliência e Continuidade:** Gerenciador de sessão com renovação automática de *refresh token* e cliente HTTP com *exponential backoff* para tratamento elegante de `HTTP 429`.
4. **Genealogical Proof Standard (GPS):** Toda dedução, transcrição ou hipótese é registrada em um Diário de Pesquisa (*Research Log*) auditável.
5. **Tooling Moderno e Rápido:** Formatação e linting unificados via **BiomeJS** (`@biomejs/biome: 2.5.14`). Sem ESLint ou Prettier.

---

## 2. Estrutura de Diretórios Proposta (Visão Fase 1)

```
familysearch/
├── .env.example                     # Template de variáveis de ambiente obrigatórias
├── .gitignore                       # Ignora .env, node_modules, .next, etc.
├── biome.json                       # Configuração única do BiomeJS 2.5.14
├── components.json                  # Configuração do shadcn/ui
├── next.config.ts                   # Configuração Next.js 16 com OpenNext
├── open-next.config.ts              # Configuração de build para Cloudflare
├── package.json                     # Scripts e dependências pnpm
├── pnpm-lock.yaml                   # Lockfile determinístico pnpm
├── tsconfig.json                    # TypeScript ^7.0.2 com paths alias (@/*)
├── wrangler.jsonc                   # Configuração do Cloudflare Workers/Pages
│
├── docs/                            # Documentação Viva (AI-Friendly)
│   └── ai/
│       ├── agents.md                # Persona, regras cognitivas e limites do agente
│       ├── rules.md                 # Convenções de código, tipagem Zod e tratamento de erros
│       ├── skills.md                # Especificação técnica das ferramentas MCP
│       ├── FAMILYSEARCH_API.md      # Mapeamento de endpoints, DGS e GEDCOM X
│       └── changelog.md             # Histórico iterativo das entregas de cada fase
│
├── src/
│   ├── app/                         # Next.js 16 App Router
│   │   ├── (auth)/                  # Rotas de fluxo OAuth2 FamilySearch
│   │   │   └── api/auth/callback/   # Callback seguro do OAuth2
│   │   ├── (dashboard)/             # Área principal da aplicação
│   │   │   ├── audit/               # Auditoria de árvore genealógica
│   │   │   ├── search/              # Pesquisa ativa e análise de microfilmes
│   │   │   └── research-log/        # Diário de pesquisa GPS
│   │   ├── layout.tsx               # Root Layout com temas e fontes
│   │   ├── page.tsx                 # Landing / Dashboard Inicial
│   │   └── globals.css              # Tailwind CSS v4 design tokens
│   │
│   ├── components/                  # Componentes reutilizáveis de UI
│   │   ├── ui/                      # Componentes primitivos do shadcn/ui
│   │   ├── layout/                  # Navbar, Sidebar, Header
│   │   └── genea/                   # Componentes específicos (Viewer DGS, Árvore, Log)
│   │
│   ├── lib/                         # Helpers e utilitários genéricos
│   │   ├── env.ts                   # Validação de variáveis de ambiente com Zod
│   │   ├── utils.ts                 # cn() e formatadores
│   │   └── date.ts                  # Utilitários date-fns
│   │
│   ├── services/                    # Conectores externos e APIs
│   │   ├── familysearch/
│   │   │   ├── client.ts            # Cliente HTTP com retry e rate-limiting
│   │   │   ├── oauth.ts             # PKCE OAuth2 e rotação de refresh token
│   │   │   ├── tree.ts              # Endpoints de árvore e pessoas
│   │   │   └── dgs.ts               # Resolução de Waypoints e metadados de microfilmes
│   │   └── storage/                 # Persistência de sessões e cache
│   │
│   ├── types/                       # Tipagem estrita TypeScript
│   │   ├── gedcomx.ts               # Tipos oficiais do GEDCOM X
│   │   ├── familysearch.ts          # Respostas de API e Auth
│   │   └── agent.ts                 # Mensagens, estados e diário GPS
│   │
│   └── ai/                          # Inteligência Artificial e MCP
│       ├── mcp/                     # Implementação do protocolo MCP
│       │   ├── server.ts            # Servidor MCP de ferramentas genealógicas
│       │   └── tools/               # Definições das tools (Zod schemas)
│       ├── gemini/                  # Conector do Google Gemini SDK
│       │   ├── client.ts            # Cliente Gemini Multimodal
│       │   └── vision.ts            # Rotinas de OCR e inspeção de manuscritos
│       └── prompts/                 # Biblioteca versionada de prompts de transcrição
│           ├── cyrillic-19th.ts     # Russo cirílico pré-revolucionário
│           ├── romanian-records.ts  # Romeno clássico / cirílico moldavo
│           └── reconciliation.ts    # Cruzamento fonético e regras de parentesco
│
└── tests/                           # Testes (Node.js Test Runner nativo + Playwright)
    ├── mocks/                       # Fixtures e mocks de respostas da API
    │   ├── gedcomx-sample.json
    │   └── dgs-metadata.json
    ├── unit/                        # Testes unitários com node:test + node:assert
    └── e2e/                         # Testes de UI, fluxo e integração com Playwright
```

---

## 3. Fases Detalhadas de Implementação

### 🚀 Fase 1: Setup Inicial e Governança do Projeto (FOCO IMEDIATO)
* **Objetivo:** Estabelecer a fundação tecnológica rigorosa, tooling, configuração de ambiente e documentação viva.
* **Tarefas da Fase 1:**
  1. Inicializar o ecossistema com `pnpm@12.6.0` e `package.json` com as versões estritas:
     - Next.js `16.3.6`, React `19.3.0`, TypeScript `^7.0.2`
     - Tailwind CSS `^4.3.3`, `@opennextjs/cloudflare`, `wrangler`
     - Biome JS `@biomejs/biome: 2.5.14` (removendo qualquer vestígio de ESLint/Prettier)
  2. Configurar `biome.json` com regras de formatação, import sorting e linting estrito.
  3. Configurar `tsconfig.json` e `next.config.ts` compatível com Cloudflare.
  4. Configurar Tailwind CSS v4 e instalar base do `shadcn/ui` (`components.json`, Radix/Base UI).
  5. Criar a documentação viva em `/docs/ai/`:
     - `agents.md`: Papel do pesquisador autônomo, limites éticos e heurísticas.
     - `rules.md`: Padrões de código, tipagem Zod e políticas de erro.
     - `skills.md`: Especificação das ferramentas MCP para consulta ao FamilySearch.
     - `FAMILYSEARCH_API.md`: Mapeamento de endpoints, DGS, waypoints e estruturas GEDCOM X.
     - `changelog.md`: Histórico de evolução da Fase 1.
  6. Configurar `.env.example` e módulo de validação de ambiente com Zod (`src/lib/env.ts`).
  7. Validar build inicial e verificação limpa no Biome (`pnpm biome check`).

---

### 🔐 Fase 2: Configuração, Segurança e Autenticação (OAuth2)
* **Objetivo:** Conectar a aplicação à plataforma do FamilySearch com autenticação segura de ponta a ponta.
* **Tarefas:**
  1. Implementar fluxo OAuth2 PKCE com o FamilySearch (Ambientes de Sandbox/Produção).
  2. Criar serviço de renovação contínua de *refresh token* para operações assíncronas em background.
  3. Implementar cliente HTTP resiliente com Axios/Fetch nativo com:
     - Exponential backoff em respostas `HTTP 429`.
     - Interceptadores automáticos de autorização Bearer Token.
  4. Mapear schemas Zod e types TypeScript para as entidades do padrão **GEDCOM X**.

---

### 🧠 Fase 3: Protocolo MCP e Integração Gemini Multimodal
* **Objetivo:** Transformar as capacidades da API em ferramentas autônomas que o agente possa invocar dinamicamente via MCP.
* **Tarefas:**
  1. Configurar o servidor MCP local integrando as ferramentas:
     - `search-persons`: Busca avançada por nome, variantes, datas e eventos.
     - `get-person-details`: Obtenção do registro GEDCOM X completo.
     - `get-tree-ancestors`: Navegação recursiva em árvore ascendente/descendente.
     - `get-dgs-waypoints`: Extração de índices e metadados de microfilmes DGS.
  2. Integrar o SDK do Google Gemini para orquestração agentic e multimodal.
  3. Estruturar a biblioteca de prompts especializados para decifração paleográfica (Cirílico séc. XIX/XX, Romeno, Moldavo).

---

### 💻 Fase 4: Interface Web, Design System e Formulários
* **Objetivo:** Prover experiência do usuário moderna, visualmente atraente e acessível.
* **Tarefas:**
  1. Desenvolver telas usando componentes `shadcn/ui` (Dark/Light mode via `next-themes`):
     - Formulário de Pesquisa Guiada (`react-hook-form` + `zod`).
     - Painel de Auditoria de Árvore (identificação de lacunas e inconsistências).
     - Visualizador Interativo de Microfilmes e Análises OCR do Gemini.
     - Dashboard do Diário de Pesquisa (Research Log auditável seguindo o GPS).
  2. Integrar internacionalização via `next-intl` (Português, Inglês e Romeno/Russo se aplicável).

---

### 🕷️ Fase 5: Automação Headless e Scraping de Fallback
* **Objetivo:** Garantir acesso e inspeção contínua quando microfilmes ou imagens enfrentarem limitações na API REST.
* **Tarefas:**
  1. Integrar rotinas com `node-html-parser` e Playwright headless para navegar no visualizador interativo do FamilySearch.
  2. Implementar extrator de imagens de waypoints com autenticação de sessão.
  3. Prover fallback transparente: se a API retornar restrição de acesso direto ao binário da imagem, a rotina headless faz a captura para submissão ao Gemini Vision.

---

### 🔬 Fase 6: Fluxos Multimodais Avançados, Proximidade Fonética e E2E
* **Objetivo:** Refinamento dos algoritmos de matching genealógico e testes automatizados.
* **Tarefas:**
  1. Implementar algoritmo de similaridade e proximidade fonética (ex: Soundex, Daitch-Mokotoff e normalização cirílica/latina para Colosovschi / Colosovski / Kolosovsky).
  2. Pipeline de testes unitários com o Test Runner nativo do Node.js (`node:test` + `node:assert`) e testes de interface/fluxo E2E com Playwright (aproveitando os mocks GEDCOM X).
  3. Validação do fluxo completo: busca da certidão de Iwan Colosovschi (1909) no microfilme 005610797 ponta a ponta.

---

## 4. Critérios de Conclusão da Fase 1

- [x] Repositório estruturado com pastas `src/`, `docs/ai/` e `tests/`.
- [x] `package.json` inicializado com a stack e versões prescritas.
- [x] BiomeJS configurado e rodando sem erros de lint/formatação.
- [x] Tailwind CSS v4 e shadcn/ui configurados.
- [x] Arquivos de documentação viva gerados: `agents.md`, `rules.md`, `skills.md`, `FAMILYSEARCH_API.md` e `changelog.md`.
- [x] Validador de variáveis de ambiente (`.env.example` + `src/lib/env.ts`) ativo.
- [x] **Fase 2 Concluída:** OAuth2 PKCE com FamilySearch, rotação de refresh token, criptografia AES-256-GCM de sessão, cliente com Exponential Backoff (HTTP 429) e testes unitários 100% aprovados.
- [x] **Fase 3 Concluída:** Ferramentas e Servidor MCP (`search_persons`, `get_person_details`, `get_tree_ancestors`, `get_dgs_waypoints`, `analyze_manuscript_image`), conector Google Gemini Vision com biblioteca de prompts paleográficos (cirílico/romeno/reconciliação GPS) e 13 testes unitários 100% aprovados.
- [x] **Fase 4 Concluída:** Interface completa e responsiva em Next.js 16 App Router com formulários `react-hook-form` + `zod` (`/search`), visualizador multimodal paleográfico (`ManuscriptViewer`), painel de auditoria de árvore familiar (`/audit`), diário de pesquisa auditável com exportação Markdown (`/research-log`) e 16 testes unitários 100% aprovados.
- [x] **Fase 5 Concluída:** Parser HTML de manifestos e catálogos paroquiais (`node-html-parser`), extrator headless com Playwright (`playwright-viewer`), gerenciador de fallback inteligente (REST API -> Playwright Headless) e endpoint `/api/fallback/extract-image`.
- [x] **Fase 6 Concluída:** Módulo de proximidade fonética e transliteração cirílico/romeno/latino (`src/lib/phonetic.ts`), bateria de 25 testes unitários nativos com Node.js Test Runner e suíte E2E de 4 testes no Playwright 100% aprovados.

---
**Status Atual:** 🎉 Todas as 6 Fases do Projeto Foram Concluídas com Sucesso! Projeto 100% funcional, testado e em conformidade estrita com o padrão GEDCOM X, GPS e Biome.
