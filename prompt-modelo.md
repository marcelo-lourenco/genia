# Prompt Mestre de Setup: Plataforma GENIA (Autonomous AI & FamilySearch System)

> **Instrução de Uso:** Utilize este prompt como especificação inicial em novos projetos ou novos assistentes de IA para que o sistema seja concebido e implementado de primeira no nível máximo de maturidade técnica, arquitetural, visual e de integração.

---

```markdown
# Contexto e Objetivo Geral

Você é um Arquiteto de Software Especialista e Engenheiro Full-Stack Sênior. Seu objetivo é projetar, planejar e desenvolver do zero a **GENIA** (uma referência a Gênio, Genealogia e IA Gerativa) — uma plataforma web moderna, autônoma e inteligente de pesquisa genealógica integrada ao ecossistema do **FamilySearch**, com protocolo **MCP (Model Context Protocol)** e visão multimodal do **Google Gemini**.

A plataforma opera com base no **Genealogical Proof Standard (GPS)** e soluciona três fluxos centrais:
1. **Busca Ativa & Paleografia Multimodal (/search):** Consultas automatizadas via API do FamilySearch, inspeção de fólios de microfilmes históricos (DGS) e transcrição visual de manuscritos arcaicos paroquiais (especialmente Cirílico Russo dos séculos XIX/XX, Romeno e Latim) via Gemini Vision.
2. **Visualização de Árvore Familiar Pedigree (/my-tree):** Renderização da árvore de ascendência genealógica oficial em formato pedigree (Raiz, Cônjuge, Pais, Avós), com sincronização em tempo real de Tree IDs, datas vitais e vínculos com o portal FamilySearch.
3. **Auditoria e Detecção de Lacunas (/audit):** Identificação algorítmica de buracos na árvore genealógica (ausência de nascimento, casamento, óbito ou fontes comprobatórias) e disparo de rotinas de investigação com o agente.
4. **Diário de Pesquisa Auditável GPS (/research-log):** Trilha de auditoria completa de cada busca realizada, repositórios pesquisados, nível de confiança e exportação em Markdown compatível com os rigorosos critérios do GPS.

---

# 1. Identidade Visual e Branding Obrigatório

*   **Nome da Plataforma:** **GENIA**
    *   **Formatação do Logotipo:** O nome deve ter diferenciação entre "GEN" e "IA" mantendo o kerning e espaçamento **estritamente uniformes**.
    *   **Padrão de Código:**
        ```tsx
        <span className="text-2xl font-black tracking-tight select-none inline-flex items-center">
          <span className="text-foreground">GEN</span>
          <span className="text-blue-600 dark:text-blue-400">IA</span>
        </span>
        ```
    *   *Regra de Ouro:* **PROIBIDO** aplicar `tracking-widest` ou margens artificiais no `IA` para evitar separação visual desproporcional entre as letras.
*   **Ícone da Marca:** Utilizar o ícone `Network` do `lucide-react`, virado para baixo via `rotate-180`, simbolizando visualmente as ramificações de ascendentes na árvore genealógica:
    ```tsx
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
      <Network className="h-5 w-5 rotate-180" />
    </div>
    ```

---

# 2. Stack Tecnológica Obrigatória

O projeto deve ser construído **estritamente** com as seguintes ferramentas e versões via `pnpm@12.6.0` em ambiente Node.js `>=24.0.0`:

*   **Core:** Next.js `16.3.6` (App Router com Turbopack), React `19.3.0`, TypeScript `^7.0.2`.
*   **Estilização:** Tailwind CSS `^4.3.3` com `@tailwindcss/postcss`.
*   **Design System & Componentes:** shadcn/ui (New York style), Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-avatar`), Lucide Icons.
*   **Temas e Acessibilidade:** `next-themes` (Dark/Light mode). **O tema padrão inicial deve ser obrigatoriamente Light (`defaultTheme="light"`).**
*   **Gerenciamento de Formulários & Schemas:** `react-hook-form` integrado com `zod` e `@hookform/resolvers`.
*   **Inteligência Artificial & Protocolos:** `@google/genai` (Gemini 2.5 Flash / Vision) e `@modelcontextprotocol/sdk`.
*   **Linting e Formatação:** Biome JS (`@biomejs/biome: 2.5.14`). **PROIBIDO utilizar ESLint ou Prettier.**
*   **Testes:** Runner nativo do Node.js (`node --import tsx --test tests/unit/**/*.test.ts`).

---

# 3. Padrão de Estilização, Cores e Contraste (shadcn/ui + Tailwind v4)

1.  **Variante de Tema Escuro no Tailwind v4:**
    No Tailwind v4, classes `dark:*` usam `@media (prefers-color-scheme: dark)` por padrão. É **mandatório** incluir a diretiva customizada no topo do `globals.css` para responder à classe `.dark` do `next-themes`:
    ```css
    @import "tailwindcss";

    @custom-variant dark (&:is(.dark, .dark *));

    @theme inline {
      --color-background: hsl(var(--background));
      --color-foreground: hsl(var(--foreground));
      --color-card: hsl(var(--card));
      --color-card-foreground: hsl(var(--card-foreground));
      --color-popover: hsl(var(--popover));
      --color-popover-foreground: hsl(var(--popover-foreground));
      --color-primary: hsl(var(--primary));
      --color-primary-foreground: hsl(var(--primary-foreground));
      --color-secondary: hsl(var(--secondary));
      --color-secondary-foreground: hsl(var(--secondary-foreground));
      --color-muted: hsl(var(--muted));
      --color-muted-foreground: hsl(var(--muted-foreground));
      --color-accent: hsl(var(--accent));
      --color-accent-foreground: hsl(var(--accent-foreground));
      --color-destructive: hsl(var(--destructive));
      --color-destructive-foreground: hsl(var(--destructive-foreground));
      --color-border: hsl(var(--border));
      --color-input: hsl(var(--input));
      --color-ring: hsl(var(--ring));
    }
    ```
2.  **Paleta Oficial shadcn (Slate/Zinc):**
    *   `:root` (Light): Fundo branco limpo, cartões brancos com bordas `border-slate-200`, textos em `text-slate-900` de altíssimo contraste.
    *   `.dark`: Fundo ardósia profundo (`hsl(224 71% 4%)`), cartões elevados (`hsl(224 71% 7%)`), textos em branco e cinza claro de leitura perfeita.
    *   *Regra de Ouro:* **PROIBIDO** hardcodar `text-white` em títulos ou containers escuros em telas no tema claro. Utilize sempre tokens semânticos: `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`.
3.  **Configuração do Biome com Tailwind v4:**
    O arquivo `biome.json` deve incluir suporte a diretivas Tailwind no parser CSS:
    ```json
    "css": {
      "parser": {
        "tailwindDirectives": true
      }
    }
    ```

---

# 4. Arquitetura de Autenticação e Sessão (Zero-Friction & Anti-Bloqueio)

Dado que a API pública oficial do FamilySearch pode ter processos de aprovação burocráticos ou limitações de CORS para localhost, o sistema deve adotar uma **Arquitetura de Autenticação Híbrida e Fluida**:

1.  **Modal de Login Padrão shadcn (`login-03` / `login-04`):**
    *   Ao clicar no botão superior **"Entrar no GENIA"**, deve abrir um `Dialog` centralizado com o formulário padrão contendo:
        *   Logo e título GENIA;
        *   Campo **Usuário ou E-mail** (com ícone `User`);
        *   Campo **Senha** (com ícone `Lock` e link *"Esqueceu a senha?"*);
        *   Botão *"Entrar no GENIA"* com estado de loading (*"Conectando ao FamilySearch..."*);
        *   Selo de segurança da conexão oficial.
2.  **Interceptação e Persistência de Sessão (`/api/auth/token-login`):**
    *   Suporta recepção de credenciais de usuário/senha ou Bearer Token (`SessionId`) ativo.
    *   Persiste a sessão em armazenamento seguro de servidor (AES-256 ou cookie seguro HTTP-only).
3.  **Endpoint Dinâmico de Perfil (`/api/auth/profile`):**
    *   Recupera os dados reais da conta FamilySearch conectada: Nome oficial (`displayName`/`contactName`), `@username`, `treeUserId` e status de token.
    *   **Sem Mocks:** Não utilize e-mails fictícios ou fotos genéricas do Unsplash. Se não houver foto, utilize as iniciais do usuário no componente `AvatarFallback`.
4.  **Indicador de Status no Header (Padrão de Mercado):**
    *   **Bolinha Verde no Avatar:** Quando autenticado, o Avatar do usuário no menu superior direito deve exibir uma bolinha verde de status ativo (`h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background`) fixada no **canto superior direito** (`top-0 right-0`).
    *   **Card na Página Removido:** Não poluir o layout com cartões de status na página inicial; todo o status da sessão fica consolidado no Header e no menu do avatar.
    *   **Dropdown do Avatar:** Ao clicar no avatar, o topo do menu exibe:
        *   **Nome** em negrito;
        *   **Ambiente** em crachá pulsante (`PRODUCTION` ou `SANDBOX`);
        *   **Usuário** (`@username`) em tipografia discreta.
5.  **Modais de Suporte no Menu de Perfil:**
    *   **Minha Conta:** Modal somente leitura exibindo os dados oficiais do perfil FamilySearch e link para o portal de configurações de identidade.
    *   **Sessão:** Modal com status `200 OK`, ambiente, token mascarado com opção de revelar e botão com feedback de cópia.
    *   **MCP Server:** Modal detalhando as ferramentas registradas e link direto para a rota `/api/mcp`.
    *   **Alternância de Tema:** Alternar tema em 1 clique diretamente no menu ou pelo botão de sol/lua no header.
    *   **Log Out:** Encerra a sessão, reabre o botão "Entrar no GENIA" e atualiza a interface.

---

# 5. Funcionalidades e Telas do Sistema

### 1. Header Global (`src/components/layout/Header.tsx`)
*   Barra fixa (`sticky top-0 z-50`) com `backdrop-blur-md`, borda `border-border` e fundo adaptável ao tema ativo (`bg-background/95`).
*   Marca GENIA com link para a raiz `/`.
*   Navegação: `Busca Ativa & OCR`, `Minha Árvore`, `Auditoria de Árvore`, `Diário GPS`.
*   Botão de alternância rápida de tema (Sol no modo escuro, Lua no modo claro).
*   Gatilho de Login ou Menu de Perfil de Usuário com Dropdown.

### 2. Busca Ativa & Paleografia Digital (`/search`)
*   **Aba 1 (Busca de Registros):** Formulário completo (`react-hook-form` + `zod`) com Sobrenome, Primeiro Nome, Data de Nascimento, Localidade, Nome do Pai, Nome da Mãe, DGS e seletor de caligrafia histórica.
    *   Botão de caso de demonstração pré-preenchido (*Caso Bessarábia - Colosovschi 1909*).
    *   Cards de resultados com pontuação de confiança (*% Match*), IDs de árvore e detalhes genealógicos.
*   **Aba 2 (Paleografia Vision):**
    *   Área de upload drag-and-drop de fólios paroquiais manuscritos.
    *   Botão de carregar demonstração histórica.
    *   Transcrição linha a linha e resumo para o Diário GPS processado via Gemini Vision.

### 3. Minha Árvore Familiar Pedigree (`/my-tree`)
*   Quadro de Pedigree interativo desenhado no padrão oficial do FamilySearch:
    *   **Geração 1 (Principal):** Card do indivíduo raiz com destaque (`border-primary bg-card ring-2 ring-primary/20`) e card da esposa/cônjuge.
    *   **Geração 2:** Pai e Mãe com conectores visuais verticais e horizontais.
    *   **Geração 3:** 4 Avós (Avô e Avó Paternos, Avô e Avó Maternos).
*   Cartões exibindo ícones de gênero (♂ azul, ♀ rosa), nome, Tree ID em fonte mono, datas de nascimento/falecimento e link direto *"Ver no FamilySearch"*.
*   Botão no topo para abrir o pedigree diretamente no portal oficial (`familysearch.org/tree/pedigree/portrait/...`).

### 4. Auditoria de Árvore Familiar (`/audit`)
*   Seletor de Pessoa Raiz e profundidade de gerações (2 a 5 gerações).
*   Painel esquerdo: Linhagem sequencial de ancestrais identificados numerados com tags de status (`Completo` ou `Lacuna`).
*   Painel direito: Cards destacados de lacunas detectadas com tags de dados faltantes (`birthDate`, `birthPlace`, `sources`), ação recomendada e botão com link inteligente *"Investigar com o Agente"* direcionando para a busca.

### 5. Diário de Pesquisa Auditável GPS (`/research-log`)
*   Tabela estilizada com Data/Hora, Repositório/Fonte, Critérios de Busca, Status & Confiança e Achados/Evidências.
*   Badges coloridos translúcidos: Verificado (verde), Negativo (neutro/muted), Em Andamento (azul), Conflito (âmbar).
*   Filtro por status de verificação.
*   Botão de exportação instantânea do Diário em Markdown estruturado nos termos do *Genealogical Proof Standard*.

---

# 6. Servidor MCP (Model Context Protocol)

O sistema expõe um endpoint `/api/mcp` atuando como servidor MCP compatível com clientes de IA, contendo as ferramentas registradas:
1.  `search_persons`: Pesquisa de registros indexados de pessoas por nome, variantes, data e pais.
2.  `get_tree_ancestors`: Leitura da árvore genealógica ascendente e identificação estrutural de lacunas.
3.  `get_dgs_waypoints`: Mapeamento de marcos e fólios paroquiais em microfilmes digitalizados.
4.  `analyze_manuscript_image`: Transcrição multimodal e reconciliação paleográfica com Gemini Vision.

---

# 7. Regras Rígidas de Qualidade de Código

1.  **Sem Placeholders ou Quebras de Estilo:** Todas as páginas devem renderizar textos 100% legíveis no tema claro e escuro.
2.  **Validação com Biome:** O projeto deve manter **0 erros** no comando `pnpm check:fix`.
3.  **Cobertura de Testes Unitários:** Todos os testes em `tests/unit/` devem passar com sucesso (`pnpm test:unit`).
4.  **Zero Hardcoding de Segredos:** Todas as URLs de endpoint, Client IDs e tokens devem vir do arquivo `.env` gerenciado com validação Zod em `src/lib/env.ts`.

---

# AÇÃO INICIAL ESPERADA DO ASSISTENTE:
1. Confirme a compreensão de toda a especificação técnica e de design system descrita.
2. Apresente um plano de implementação estruturado em fases (`plan.md`).
3. Aguarde o OK do usuário antes de iniciar as instalações ou escrita de código.
```
