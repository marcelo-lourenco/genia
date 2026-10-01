# Regras de Engenharia, Estilo e Convenções (rules.md)

## 1. Stack e Ferramental de Desenvolvimento
* **Runtime & Gerenciador de Pacotes:** Node.js `>=24.0.0` e `pnpm@12.6.0`.
* **Linting e Formatação Exclusivos:** **BiomeJS (`@biomejs/biome: 2.5.14`)**.
  - É **expressamente proibido** instalar ou configurar ESLint, Prettier ou plugins concorrentes.
  - A configuração do Biome deve incluir suporte a diretivas Tailwind:
    ```json
    "css": {
      "parser": {
        "tailwindDirectives": true
      }
    }
    ```
  - Todo commit deve passar com **0 erros** no comando: `pnpm biome check src docs tests`.

---

## 2. Padrões de Estilização e Design Tokens (Tailwind v4 + shadcn/ui)
* **Variante Dark no Tailwind v4:**
  - O Tailwind CSS v4 requer a declaração explícita de classe customizada:
    ```css
    @custom-variant dark (&:is(.dark, .dark *));
    ```
* **Uso Obrigatório de Tokens Semânticos:**
  - **NÃO** hardcode cores absolutas (ex: `text-white`, `bg-slate-900`) para elementos estruturais sem suporte duplo de tema.
  - Textos principais: `text-foreground`
  - Textos secundários/apoio: `text-muted-foreground`
  - Planos de fundo de página: `bg-background`
  - Cartões e containers elevados: `bg-card` e `text-card-foreground`
  - Bordas de divisórias e inputs: `border-border` e `border-input`
  - Ações primárias: `bg-primary` e `text-primary-foreground`
* **Tema Padrão:** O tema padrão do sistema deve ser inicializado como **Light** (`defaultTheme="light"` no `ThemeProvider`).

---

## 3. Tipagem e Validação em Camadas (TypeScript + Zod)
* **TypeScript Estrito:** `noImplicitAny: true`, `strict: true`.
* **Proibição de `any` Desenfreado:** Utilize `unknown` acompanhado de validação com Type Guards ou schemas Zod.
* **Validação em Todas as Fronteiras:**
  - Parâmetros de formulário e inputs de busca: validados por schemas Zod (`searchFormSchema`).
  - Variáveis de ambiente: validadas em `src/lib/env.ts` no momento da inicialização da aplicação.
  - Respostas da API externa do FamilySearch e do servidor MCP: mapeadas para interfaces estritas com tipagem em `src/types/`.

---

## 4. Arquitetura e Organização de Pastas (Clean Architecture)
* **`src/services/`:** Lógica de integração externa com a API do FamilySearch, parsers GEDCOM X e manipulação de sessão em disco/storage.
* **`src/ai/`:** Módulos de inteligência artificial: cliente do Gemini Vision, biblioteca de prompts paleográficos e definições do protocolo MCP.
* **`src/app/`:** Rotas de páginas e Route Handlers da API (`/api/mcp`, `/api/auth/*`).
* **`src/components/ui/`:** Componentes base padronizados do shadcn/ui (Button, Dialog, DropdownMenu, Avatar, Input, Label).
* **`src/components/genea/`:** Componentes de negócio de genealogia (SearchForm, ManuscriptViewer, TreeAuditView, ResearchLogTable).
* **`src/components/layout/`:** Header, navegação e modais de autenticação e sessão.

---

## 5. Segurança, Privacidade e Proibição Absoluta de Hardcoding de Dados Pessoais (PII)
* **Zero Hardcoding de Segredos e Credenciais:** Tokens (`access_token`, `refresh_token`), Client IDs, senhas e chaves de API nunca devem ser fixados no código-fonte. Devem residir exclusivamente no `.env` local (que é estritamente ignorado pelo `.gitignore`) e ser acessados via `getEnv()`.
* **Proibição Absoluta de Dados Pessoais Fixos (PII):**
  - É expressamente proibido fixar em arquivos de código (`.tsx`, `.ts`, `.json`, `.md`) nomes reais de usuários, credenciais, e-mails, usernames ou identificadores de árvores (Tree IDs, como `GYT8-36P`).
  - Todo perfil de usuário e visualização de árvore genealógica (`/my-tree`, Header, modais) **deve ser 100% dinâmico**, extraído da sessão ativa via `/api/auth/profile` e da API do FamilySearch via `/api/mcp`.
  - Quaisquer placeholders ou fallbacks de interface devem usar termos neutros e genéricos (ex: `"Usuário FamilySearch"`, `"@usuario"`, `"KWQS-BB1"`, `"LXYZ-123"`).
* **Criptografia Simétrica de Tokens:** Tokens salvos em cookies ou storage devem utilizar `AES-256-GCM` com verificação de integridade.
* **Resiliência e Rate-Limiting:** Toda chamada à API do FamilySearch deve implementar política de retry com *Exponential Backoff* tratando status `HTTP 429` e `HTTP 5xx`.

---

## 6. Estratégia de Testes
* **Testes Unitários:** Desenvolvidos estritamente com o **Node.js Test Runner nativo** (`node:test` e `node:assert`), executados via:
  ```bash
  pnpm test:unit
  ```
* **Mocks de API:** Chamadas de rede da API do FamilySearch e do Gemini Vision devem ser mockadas nos testes unitários para garantir execução rápida, idempotente e sem consumo de cotas de produção.

---

## 7. Padrão Obrigatório de Mensagem de Commit ao Final de Cada Implementação
* **Geração Automática de Commit:** Ao concluir qualquer implementação, correção ou refatoração, o agente de IA deve **obrigatoriamente** fornecer ao final de sua resposta a mensagem de commit correspondente.
* **Formato Estrito (Apenas Texto Puro):**
  - A mensagem de commit deve ser entregue **sempre como texto puro**, sem comandos git externos (proibido incluir `git add .` ou `git commit -m "..."`).
  - Padrão **Conventional Commits**: Título conciso indicando o tipo da alteração (`feat:`, `fix:`, `refactor:`, `style:`, `test:`, `docs:`), acompanhado de lista em tópicos detalhando com clareza o que foi modificado em cada módulo.

---

## 8. Atualização Contínua da Documentação e Base de Conhecimento do Agente
* **Sincronização Obrigatória em Toda Entrega:**
  - Sempre que for realizada qualquer implementação, atualização, correção, melhoria ou refatoração no sistema, a documentação viva (`docs/ai/changelog.md`, `README.md`, `docs/ai/skills.md`, etc.) **deve ser atualizada imediatamente** para refletir com precisão o estado real do projeto.
  - Toda mudança funcional deve ser registrada no histórico do `changelog.md`.
* **Evolução Contínua do Conhecimento dos Agentes de IA:**
  - Sempre que forem definidas novas diretrizes, boas práticas, regras de **"o que NÃO fazer" (anti-patterns)**, decisões de arquitetura, padrões de engenharia, UI/UX ou segurança relevantes para o trabalho dos agentes de IA, a documentação técnica (`docs/ai/rules.md` e `docs/ai/agents.md`) **deve ser atualizada imediatamente**.
  - O agente não deve apenas seguir a instrução pontualmente, mas sim registrar a diretriz na base de conhecimento para que todos os agentes subsequentes operem sob as mesmas regras.
