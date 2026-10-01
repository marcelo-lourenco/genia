# Changelog do Projeto (changelog.md)

Todas as mudanças relevantes e entregas de cada fase serão registradas neste documento.

---

## [Fase 1] - 2026-09-30
### Adicionado
- Estrutura base de pastas seguindo Clean Architecture (`src/`, `docs/ai/`, `tests/`).
- Configuração do `package.json` com `pnpm@12.6.0`, Node `>=24.21.0`, Next.js `16.3.6`, React `19.3.0` e TypeScript `^7.0.2`.
- Configuração do **BiomeJS 2.5.14** como linter e formatador unificado (`biome.json`), sem ESLint nem Prettier.
- Configuração de build Cloudflare Workers/Pages via `@opennextjs/cloudflare` e `wrangler.jsonc`.
- Configuração do Tailwind CSS v4 e base do shadcn/ui (`components.json`).
- Template de segurança `.env.example` e módulo de validação de ambiente com schemas Zod.
- Documentação Viva em `/docs/ai/`:
  - `agents.md`: Definição da persona do agente e diretrizes do Genealogical Proof Standard (GPS).
  - `rules.md`: Regras de estilo de código, testes e tratamento de erros.
  - `skills.md`: Especificação técnica das ferramentas MCP.
  - `FAMILYSEARCH_API.md`: Mapeamento de endpoints e estrutura do padrão GEDCOM X.
- Estratégia de testes configurada com Node.js Test Runner (`node:test`) para unitários e Playwright para UI/E2E.

---

## [Fase 2] - 2026-10-01
### Adicionado
- **Fluxo OAuth2 PKCE com FamilySearch:**
  - Gerador de pares PKCE criptográficos (`code_verifier` e `code_challenge` SHA-256 base64url).
  - Suporte comutável entre os ambientes **Sandbox** (`identbeta.familysearch.org`) e **Produção** (`ident.familysearch.org`).
  - Troca de código de autorização por tokens (`access_token`, `refresh_token`).
  - Renovação automática de token expirado com rotação de refresh token (`refreshAccessToken`).
- **Gerenciador de Sessão Blindado (`src/services/storage/session.ts`):**
  - Armazenamento em cookies HTTP-only encriptados ponta a ponta com **AES-256-GCM** via `node:crypto`.
  - Zero exposição de credenciais ou tokens no client-side.
- **Cliente HTTP Resiliente (`src/services/familysearch/client.ts`):**
  - Interceptador automático de autorização Bearer e formato `application/x-gedcomx-v1+json`.
  - Gestão de **Rate Limiting (HTTP 429)** com *Exponential Backoff* e Jitter aleatório (até 3 tentativas).
  - Tratamento proativo de `HTTP 401 Unauthorized` com tentativa de renovação de token e replay transparente.
- **Route Handlers de Autenticação (`src/app/api/auth/`):**
  - `/api/auth/login`: Inicializa PKCE e redireciona ao portal FamilySearch.
  - `/api/auth/callback`: Trata o retorno do código, executa troca de tokens e cria sessão segura.
  - `/api/auth/session`: Endpoint de consulta de status de autenticação e expiração.
  - `/api/auth/logout`: Revogação e limpeza segura de cookies de sessão.
- **Serviço de Perfil de Usuário (`src/services/familysearch/user.ts`):**
  - Consulta do perfil autenticado em `/platform/users/current`.
- **Testes Unitários da Fase 2:**
  - `tests/unit/oauth.test.ts`: Valida PKCE, construção de URL OAuth2, resolução de ambientes e criptografia AES-256-GCM.
  - `tests/unit/client.test.ts`: Valida cálculo e limites do algoritmo de Exponential Backoff.
  - 100% de aprovação (7/7 testes passando) com o Node.js Test Runner.

---

## [Fase 3] - 2026-10-01
### Adicionado
- **Serviços de Árvore e Registros do FamilySearch (`src/services/familysearch/`):**
  - `search.ts`: Busca avançada no FamilySearch (`/platform/tree/search`) com suporte a nomes, variantes, datas, locais e nomes de pais.
  - `person.ts`: Recuperação detalhada de fichas genealógicas GEDCOM X (`/platform/tree/persons/{personId}`).
  - `tree.ts`: Navegação recursiva em árvore ascendente (`/platform/tree/ancestry`) com detecção automatizada de lacunas/buracos na árvore.
  - `dgs.ts`: Resolução de metadados, processos arquivísticos (Delo/Opis/Fond) e waypoints de microfilmes DGS (`/platform/records/images/waypoints`).
- **Servidor e Ferramentas do Model Context Protocol (MCP) (`src/ai/mcp/`):**
  - Integração do `@modelcontextprotocol/sdk` (v1.31.0) com inicialização de servidor MCP.
  - Implementação das ferramentas: `search_persons`, `get_tree_ancestors`, `get_dgs_waypoints` e `analyze_manuscript_image`.
  - Endpoint de transporte HTTP JSON para clientes MCP em `/api/mcp`.
- **Testes Unitários da Fase 3:**
  - `tests/unit/mcp.test.ts`: Validação de registro de ferramentas e schemas Zod.
  - 100% de aprovação (10/10 testes passando).

---

## [Fase 4] - 2026-10-01
### Adicionado
- **Interface e Casos de Uso Core da Aplicação:**
  - `/search`: Busca Ativa com formulário Zod e visualizador paleográfico Gemini Vision.
  - `/audit`: Auditoria de Árvore com detecção de lacunas e recomendação probatória.
  - `/research-log`: Diário de Pesquisa auditável GPS com filtros e exportação Markdown.
- **Prompts Especializados Gemini Vision (`src/ai/gemini/prompts.ts`):**
  - Regras paleográficas para registros paroquiais cirílicos do século XIX/XX e romenos.
  - Instruções de reconciliação de dados genealógicos para o Diário GPS.

---

## [Fase 5] - 2026-10-01
### Adicionado
- **Parser de Manifestos de Catálogo e Filmes (`src/services/scraper/html-parser.ts`):**
  - Extração de alta velocidade de números de DGS, títulos de filmes paroquiais e segmentação arquivística por processos (Дело / Delo, Опись / Opis, Фонд / Fond).
- **Extrator Headless com Playwright (`src/services/scraper/playwright-viewer.ts`):**
  - Captura automatizada de fólios de microfilmes históricos do visualizador digital do FamilySearch.
- **Gerenciador de Fallback Inteligente (`src/services/scraper/fallback-manager.ts`):**
  - Orquestração híbrida de extração com fallback transparente via Playwright.

---

## [Fase 6] - 2026-10-01
### Adicionado
- **Módulo de Proximidade Fonética e Transliteração Cirílico-Latim (`src/lib/phonetic.ts`):**
  - Transliteração completa de russo cirílico arcaico e moderno (ѣ, і, ѳ) para latim.
  - Normalizador de sufixos patronímicos e variações ortográficas eslavas.
  - Russell Soundex e cálculo de distância de Levenshtein.
- **Sessão Híbrida Direta:**
  - Leitura das credenciais no `.env` e persistência de sessão ativa via token bearer.

---

## [Fase 7] - 2026-10-01
### Adicionado / Refatorado
- **Identidade Visual e Branding GENIA:**
  - Logotipo oficial **GENIA** com tipografia uniforme (`text-2xl font-black tracking-tight`), mantendo distinção de cor entre `GEN` (cor neutra) e `IA` (azul vibrante) com kerning uniforme.
  - Ícone oficial: `Network` do `lucide-react` com rotação de 180° (`rotate-180`), simbolizando as ramificações de ascendência genealógica.
- **Design System shadcn/ui & Correção de Contraste (Tailwind CSS v4):**
  - Inclusão mandatória de `@custom-variant dark (&:is(.dark, .dark *));` e `@theme inline` no `globals.css` para funcionamento pleno da alternância de tema no Next.js.
  - Tema **Light** definido como padrão inicial (`defaultTheme="light"`).
  - Adoção integral de design tokens semânticos (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `bg-background`).
  - Resolução de contraste: eliminação de títulos brancos em fundos claros e containers escuros flutuantes em páginas claras.
- **Autenticação Modal shadcn (`login-03` / `login-04`) & Sessão Fluida:**
  - O botão *"Entrar no GENIA"* no Header abre um modal `Dialog` centralizado com o formulário padrão shadcn `LoginForm`.
  - Endpoint `/api/auth/token-login` conecta a sessão e `/api/auth/profile` fornece dados dinâmicos do perfil FamilySearch.
  - Indicador de presença ativo (bolinha verde `bg-emerald-500`) posicionado no canto superior direito do Avatar (`top-0 right-0`).
  - Remoção de poluição visual na Home (status da sessão transferido exclusivamente para o Avatar e menu de perfil).
  - Menu dropdown exibindo Nome, Usuário (@username) e crachá de Ambiente (`PRODUCTION`).
- **Gráfico de Pedigree Familiar (`/my-tree`):**
  - Gráfico de ascendência interativo de 3 a 4 gerações (Raiz, Cônjuge, Pais e Avós) com padrão visual do FamilySearch, Tree IDs e links diretos.
- **Documentação de Engenharia e Agentes de IA:**
  - Criação do `README.md` completo para desenvolvedores humanos.
  - Atualização de `docs/ai/agents.md`, `docs/ai/rules.md` e `docs/ai/skills.md`.
  - Criação do `prompt-modelo.md` como especificação mestre reutilizável.
- **Qualidade & Testes:**
  - 26/26 testes unitários passando.
  - Biome JS com 0 erros em 64 arquivos.

---

## [Fase 8] - 2026-10-01
### Adicionado / Refatorado
- **Generalização Universal da Busca e Paleografia (`/search`):**
  - Desvinculação completa de casos de teste específicos (remoção de referências rígidas a Colosovschi, Ivan e Bessarábia).
  - Estruturação em 6 modalidades alinhadas ao FamilySearch: *Registros Históricos*, *Texto Completo (IA)*, *Imagens & DGS*, *Árvore Familiar*, *Livros & Genealogias* e *Paleografia Vision*.
  - Suporte universal a idiomas no decifrador multimodal Gemini (`src/ai/gemini/vision.ts` e `ManuscriptViewer.tsx`): Português cartorial/paroquial, Italiano de *Stato Civile*, Espanhol, Latim eclesiástico, Alemão *Kurrent/Fraktur*, Russo Cirílico, Romeno, Francês, Polonês, Hebraico, Inglês e modo de auto-detecção.
- **Auditoria de Árvore Dinâmica & Diagnóstico com IA (`/audit`):**
  - Seletor dinâmico de pessoas com busca integrada à API do FamilySearch por nome ou identificador (ID).
  - Endpoint de diagnóstico estratégico com IA `/api/audit/diagnosis` utilizando **Google Gemini 3.5 Flash**.
  - Geração de roteiro probatório GPS em tempo real, priorizando fontes arquivísticas e certidões faltantes com plano de ação em 3 passos.
  - Botão de investigação direta em cada lacuna, redirecionando para a busca com contexto preenchido.
- **Diário de Pesquisa Persistente (`/research-log`):**
  - Camada de armazenamento persistente em arquivo JSON (`src/data/research-log.json`).
  - Route Handler `/api/research-log` implementando métodos `GET`, `POST` e `DELETE`.
  - Interface com modal `Dialog` para cadastro de novas investigações probatórias, filtros por status e exportação em Markdown GPS.
- **Customizador de Tema em Tempo Real (Estilo shadcn/ui `ui.shadcn.com/create`):**
  - Implementação de `ThemeCustomizer.tsx` e `theme-config.ts` com injeção dinâmica de CSS variables no DOM (`--primary`, `--radius`, `--font-heading`, `--font-body`, cores de fundo e cartões).
  - Painel flutuante sem overlay/backdrop ("sem tela fosca"), permitindo acompanhar a transformação visual dos componentes ao vivo.
  - Suporte a estilos (Nova, Default, Compact), paletas base (Slate, Zinc, Stone, Neutral, Gray), cores de acento (Blue, Violet, Emerald, Rose, Orange, Amber, Cyan), tipografia Google Fonts (Inter, Outfit, Plus Jakarta Sans, Roboto, Playfair Display, JetBrains Mono) e raios de borda (0 a 1.0rem).
  - Persistência das configurações no `localStorage`.
  - Acesso centralizado e exclusivo via item *"Personalizar UI"* no dropdown do Avatar no Header.
- **Padronização de Diretrizes de IA (`docs/ai/rules.md` e `docs/ai/agents.md`):**
  - Regra obrigatória estabelecida: o agente de IA deve sempre entregar a mensagem de commit correspondente ao final de cada tarefa, estritamente em formato de texto puro sem comandos de terminal.
  - Instituída a governança de atualização contínua: a cada implementação/melhoria a documentação viva deve ser sincronizada, e qualquer nova diretriz ou anti-pattern deve ser incorporada imediatamente à base de conhecimento dos agentes.
- **Simplificação de Nomenclatura de Interface:**
  - Padronização dos botões de autenticação do Header e do modal `LoginForm` para o rótulo direto *"Entrar"*, substituindo *"Entrar no GENIA"*.
- **Depreciação e Limpeza de Variáveis de Ambiente:**
  - Remoção completa de `FAMILYSEARCH_USER_NAME` de `.env`, `.env.example`, `src/lib/env.ts` e `README.md`.
  - Endpoint `/api/auth/profile` agora extrai os nomes diretamente do perfil autenticado do FamilySearch (`fsUser?.displayName` / `fsUser?.contactName`), sem dependência de variáveis estáticas.
- **Sanitização de Segurança & Blindagem contra Exposição de PII:**
  - Erradicação absoluta de credenciais, senhas, tokens de sessão, e-mails, nomes reais e identificadores de árvores (Tree IDs) hardcoded no código-fonte.
  - Campos de login em `LoginForm.tsx` inicializados estritamente vazios, com placeholders neutros.
  - Remoção de tokens e nomes mockados do `Header.tsx`, `layout.tsx` e rotas de autenticação.
  - Reformulação completa da página `/my-tree` para renderização **100% dinâmica**: consome o perfil autenticado (`/api/auth/profile`) e a API do FamilySearch (`/api/mcp`), permitindo busca por qualquer ID com numeração Ahnen genealógica oficial.
  - Atualização de `docs/ai/rules.md` (Seção 5) formalizando a regra inegociável de zero hardcoding de dados pessoais.
- **Correção da Resolução de Identificador de Árvore & Erro HTTP 410 Gone:**
  - Diagnóstico e correção no mapeamento de `/platform/users/current`: o FamilySearch retorna `user.treeUserId` como um identificador interno de conta (`9QZ9-PY5`) que não existe na árvore familiar (gerando erro `HTTP 410 Gone` no MCP).
  - Atualizado `src/services/familysearch/user.ts` para mapear `user.personId` e extrair o ID real da pessoa em `user.links.person.href`.
  - Atualizado `src/services/familysearch/tree.ts` com tratamento amigável de erro HTTP 410 e suporte completo a cônjuge (`ascendancyNumber === "1-S"`).
  - Árvore familiar agora renderiza com sucesso em tempo real todos os ancestrais e cônjuges diretamente da API do FamilySearch.
- **Auditoria Dinâmica do Usuário Logado (`/audit`):**
  - Eliminação do ID fictício `KWQS-BB1` que disparava erro `HTTP 403 Forbidden` (registro em espaço privado/restrito).
  - Componente `TreeAuditView.tsx` agora obtém o perfil autenticado (`/api/auth/profile`) ao carregar e preenche automaticamente o campo com o ID canônico da pessoa logada no FamilySearch.
  - Execução automática da auditoria genealógica sobre a linhagem do usuário conectado, detectando lacunas e habilitando diagnóstico estratégico com IA sem qualquer erro.
- **Resiliência contra HTTP 503 (High Demand) na IA Gemini (`/api/audit/diagnosis`):**
  - Implementada cascata de modelos de IA (`gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-flash-lite-latest`) para mitigar sobrecargas momentâneas nos servidores da Google ("This model is currently experiencing high demand").
  - Em caso de indisponibilidade ou instabilidade em um modelo, o sistema faz o failover automático e transparente para a próxima variante, garantindo a geração contínua do Diagnóstico Estratégico GPS.

---

## [Fase 9] - 2026-10-01
### Adicionado
- **Estação de Trabalho Paleográfica & Decifrador Multimodal (`/search` & `ManuscriptViewer.tsx`):**
  - Canvas interativo com zoom suave (70% a 400%), pan por arraste com o mouse e rotação fina de 90° a 360°.
  - Controles de tratamento de imagem em tempo real: Sliders de Brilho (50% a 180%), Contraste (50% a 220%) e **Modo Negativo / Inversão de Cores (DGS)** para leitura de microfilmes históricos escurecidos ou de baixa nitidez.
  - Abas de análise com transição instantânea: *Original Diplomático*, *Tradução em Português Moderno* (para certidões em latim, cirílico, italiano ou alemão) e *Entidades GPS* (tipo de registro, data, local, filiação, testemunhas e vigário).
  - Ação integrada *"Vincular ao Diário de Pesquisa"*: gravação direta do fólio transcrito em `/api/research-log` com feedback imediato e atalho para navegação.
  - Cascata de resiliência a 503 integrada no decifrador visual Gemini em `src/ai/gemini/vision.ts`.
- **GENIA Copilot Conversacional (Drawer Lateral Global & Atalho `Ctrl+J`):**
  - Implementação de `CopilotDrawer.tsx` montado no `RootLayout` (`layout.tsx`), acessível a partir de qualquer tela da aplicação via botão flutuante e atalho de teclado global `Ctrl + J` (ou `Cmd + J`).
  - Endpoint de conversação com IA `/api/chat` dotado de cascata de modelos (`gemini-3.5-flash` -> `gemini-3.5-flash-lite` -> `gemini-flash-lite-latest`).
  - Consciência de contexto dinâmico (*Context-Awareness*): detecta a rota ativa (`/my-tree`, `/audit`, `/search`, etc.) e informa a persona do copiloto.
  - Sugestões rápidas de pesquisa genealógica (superação de *brick walls*, Padrão GPS, busca em acervos de Portugal/Itália/Brasil, latim eclesiástico e desembarque de imigrantes).
- **Agente de Investigação Autônoma de Ponta a Ponta (`/audit` & `InvestigationModal.tsx`):**
  - Adicionado botão *"Investigação Autônoma GPS"* em cada lacuna detectada na árvore do usuário.
  - Endpoint da máquina de raciocínio probatório `/api/agent/investigate`: executa a cadeia probatória completa do Genealogical Proof Standard (GPS).
  - Modal com timeline animada de 5 etapas:
    1. Delimitação da lacuna e extração de contexto.
    2. Mapeamento de cartórios, paróquias e acervos competentes.
    3. Geração de variantes onomásticas e roteiro de busca em 3 passos.
    4. Síntese probatória GPS com cálculo de confiança.
    5. Gravação automática e persistente da hipótese no Diário de Pesquisa (`/research-log`).
  - Ações diretas no modal para abrir a entrada no Diário GPS ou realizar busca manual.
- **Conformidade de Qualidade & Testes:**
  - 100% de conformidade com o BiomeJS (`0 erros` em 74 arquivos).
  - 26/26 testes unitários passando (`pnpm test:unit`).
  - Validação ponta a ponta com subagente de browser no ambiente ativo.

