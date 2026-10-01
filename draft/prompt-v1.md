# Contexto e Objetivo Geral

Você é um Arquiteto de Software Sênior e Especialista em Agentes de IA. Seu objetivo é projetar, planejar e desenvolver um sistema autônomo e web-based de pesquisa genealógica integrado ao FamilySearch, utilizando o protocolo MCP (Model Context Protocol), TypeScript e as capacidades multimodais do Gemini.

Este sistema atuará em dois casos de uso principais:
1. **Busca Ativa e Análise Multimodal:** Acessar microfilmes (DGS), extrair e analisar imagens manuscritas não indexadas (como registros paroquiais em cirílico do séc. XIX) via OCR/Vision, e cruzar com dados informados pelo usuário.
2. **Auditoria de Árvore Familiar:** Explorar árvores existentes via API, encontrar lacunas ("buracos"), sugerir reconciliações e documentar novas fontes.

---

# 1. Stack Tecnológica Obrigatória

O projeto deve ser construído **estritamente** com as seguintes tecnologias e versões. O gerenciamento será feito via `pnpm@12.6.0` em ambiente Node.js `>=24.21.0`.

*   **Core:** Next.js `16.3.6` (App Router), React `19.3.0`, TypeScript `^7.0.2`.
*   **Deploy/Infra:** Cloudflare (via `@opennextjs/cloudflare` e `wrangler`).
*   **Estilização e UI:** Tailwind CSS `^4.3.3`, shadcn/ui (`^4.21.0`), Radix UI, `@base-ui/react`.
*   **Gerenciamento de Estado/Formulários:** `react-hook-form` integrado com `zod` e `@hookform/resolvers`.
*   **Utilitários:** `date-fns` (datas), `uuid`, `minisearch`.
*   **Linting e Formatação:** Biome JS (`@biomejs/biome: 2.5.14`). **O projeto NÃO deve utilizar ESLint ou Prettier.**
*   **Internacionalização e Temas:** `next-intl`, `next-themes` (Dark/Light mode).
*   **Scraping / Fallback:** `node-html-parser` e/ou Playwright/Puppeteer (para automação headless quando a API REST for insuficiente).

---

# 2. Arquitetura e Modularização

O código deve seguir princípios de Clean Architecture ou Hexagonal, separando a lógica de negócios da infraestrutura (APIs externas). 
*   **Estrutura Base (Next.js App Router):**
    *   `app/`: Rotas web, páginas e layouts.
    *   `components/`: Componentes de UI (shadcn/ui e genéricos).
    *   `lib/`: Utilitários de formatação e helpers genéricos.
    *   `services/`: Conexões externas (FamilySearch API, autenticação).
    *   `ai/`: Integrações MCP, Gemini, e biblioteca de prompts.

---

# 3. Segurança, Sessão e Resiliência

*   **Credenciais Blindadas:** TODAS as chaves de API (OAuth2, App Key, Gemini API Keys, etc.) DEVEM estar exclusivamente em um arquivo `.env` local ou Cloudflare Secrets (com um `.env.example` versionado). **Zero Hardcoding.**
*   **Manipulação Segura:** Chaves devem ser manipuladas exclusivamente no lado do servidor (Server Actions ou Route Handlers).
*   **Gerenciamento de Sessão (OAuth2):** O sistema deve renovar automaticamente os tokens rotativos do FamilySearch (*refresh token*) sem interromper processos longos de pesquisa em background.
*   **Rate Limiting:** Implementar *Exponential Backoff*, *retries* automáticos e tratamento amigável de erros `HTTP 429 (Too Many Requests)` para proteger a cota da API.

---

# 4. Funcionalidades do Agente de IA (Gemini / MCP)

*   **Padrão GEDCOM X:** Todo o tráfego de dados e estruturação interna devem mapear as respostas para a estrutura base do **GEDCOM X** (padrão oficial do FamilySearch).
*   **Análise Multimodal (Vision/OCR):** Os fluxos que enviam imagens ao LLM (na pasta `ai/prompts/`) devem ser estruturados para:
    *   Trabalhar com múltiplos idiomas e caligrafias dos séculos XIX e XX (especialmente Russo Cirílico, Romeno, Latim).
    *   Identificar datas, locais e indivíduos a partir de "waypoints" (DGS) de microfilmes.
*   **Lógica de Cruzamento:** Avaliar a "Proximidade Fonética" de nomes e sobrenomes ao cruzar informações (ex: Iwan/Ivan/João ou Colosovski/Colosovschi).
*   **Fallback Híbrido:** Se a API do FamilySearch retornar restrição de acesso direto a imagens por direitos autorais, o agente deve acionar rotinas de extração baseadas em automação headless/scraping para obter a imagem para análise.
*   **Diário de Pesquisa (Research Log):** O agente deve gerar logs auditáveis documentando a pesquisa com base no *Genealogical Proof Standard (GPS)* (ex: "Buscado no filme 005610797, folhas 327-378: resultado negativo para 'Colosovschi'").

---

# 5. Padrões de Qualidade e Documentação (Meta-Requisitos AI-Friendly)

*   **Documentação Viva:** Antes de codificar, gere na raiz do projeto (ex: pasta `.cursor/` ou `docs/ai/`):
    *   `agents.md`: Define a persona e limites de atuação do agente pesquisador.
    *   `rules.md`: Regras de estilo de código, tratamento de erros e convenções.
    *   `skills.md`: Documentação técnica das ferramentas MCP disponíveis.
    *   `FAMILYSEARCH_API.md`: Mapeamento dos endpoints que serão utilizados.
    *   `changelog.md`: Atualizado ao final de cada fase.
*   **Tipagem e Validação:** Código estritamente tipado (TypeScript). Validação de fronteiras (inputs/outputs de API) usando schemas **Zod**.
*   **Testes (TDD):** O projeto exige cobertura de testes unitários e de integração (Jest/Vitest) para lógicas core, parsers GEDCOM e autenticadores. Crie *mocks* para a API do FamilySearch para rodar testes sem consumir cotas.

---

# 6. Planejamento e Fases de Implementação (AÇÃO OBRIGATÓRIA)

**NÃO inicie a codificação imediatamente.** Antes de escrever qualquer código-fonte da aplicação, você DEVE gerar um documento de "Plano de Implementação" (`plan.md`) dividido em fases rigorosas.

*   **Fase 1: Setup Inicial.** Inicializar `pnpm`, instalar dependências (`package.json`), configurar Tailwind v4, BiomeJS, estrutura Next.js e criar a documentação de IA (`/docs/ai/`).
*   **Fase 2: Camada de Configuração e Autenticação.** Serviços de OAuth2 (Server-side) e configuração segura de tokens do FamilySearch.
*   **Fase 3: Implementação MCP e Integração Gemini.** Criar ferramentas de busca na API (search-persons, get-tree) e a camada de abstração para enviar prompts e imagens ao LLM.
*   **Fase 4: UI / UX e Formulários.** Desenvolver a interface com `shadcn/ui`, acessibilidade, formulários de submissão (`react-hook-form` + `zod`) e o dashboard do diário de pesquisa.
*   **Fase 5: Automação / Scraping (Fallback).** Integrar rotinas para navegação visual e extração de imagens restritas.
*   **Fase 6: Fluxos Multimodais Avançados.** Refinar prompts de OCR, cruzamento de dados, reconciliação de árvore e testes de ponta a ponta.

**Comando Inicial para o Assistente:**
Por favor, confirme o entendimento de todas as diretrizes técnicas e de arquitetura descritas acima. Em seguida, gere e apresente o arquivo **`plan.md`** (Plano de Implementação) e a árvore de diretórios proposta para a Fase 1. **Aguarde a minha aprovação antes de executar a instalação ou codificação.**