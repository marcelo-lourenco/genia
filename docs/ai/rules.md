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

## 5. Segurança e Gestão de Sessão
* **Zero Hardcoding de Segredos:** Tokens, Client IDs e senhas devem ser lidos exclusivamente via `getEnv()` e mantidos em variáveis de ambiente (`.env`).
* **Criptografia Simétrica de Tokens:** Tokens salvos em cookies ou storage devem utilizar `AES-256-GCM` com verificação de integridade.
* **Resiliência e Rate-Limiting:** Toda chamada à API do FamilySearch deve implementar política de retry com *Exponential Backoff* tratando status `HTTP 429` e `HTTP 5xx`.

---

## 6. Estratégia de Testes
* **Testes Unitários:** Desenvolvidos estritamente com o **Node.js Test Runner nativo** (`node:test` e `node:assert`), executados via:
  ```bash
  pnpm test:unit
  ```
* **Mocks de API:** Chamadas de rede da API do FamilySearch e do Gemini Vision devem ser mockadas nos testes unitários para garantir execução rápida, idempotente e sem consumo de cotas de produção.
