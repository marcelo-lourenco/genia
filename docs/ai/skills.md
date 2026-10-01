# Especificação Técnica das Ferramentas MCP (skills.md)

Este documento descreve as ferramentas ativas expostas pelo servidor **Model Context Protocol (MCP)** da plataforma GENIA através do endpoint `/api/mcp`.

---

## Endpoint MCP da Plataforma
* **URL:** `http://localhost:3000/api/mcp`
* **Métodos Suportados:**
  - `GET`: Retorna a lista de especificações em JSON das ferramentas disponíveis (schema compatível com clientes MCP).
  - `POST`: Executa uma ferramenta específica enviando o payload `{ tool: string, arguments: object }`.

---

## Ferramentas Disponíveis

### 1. `search_persons`
* **Finalidade:** Realiza busca de registros indexados de pessoas na API do FamilySearch, aplicando cálculo de proximidade fonética (Soundex e Levenshtein).
* **Parâmetros de Entrada:**
  | Campo | Tipo | Obrigatório | Descrição |
  | :--- | :--- | :--- | :--- |
  | `surname` | `string` | **Sim** | Sobrenome do indivíduo (ex: "Colosovschi") |
  | `givenName` | `string` | Não | Primeiro nome ou variantes (ex: "Iwan" ou "João") |
  | `birthDate` | `string` | Não | Data ou ano de nascimento (ex: "18/10/1909" ou "1909") |
  | `birthPlace` | `string` | Não | Paróquia ou localidade (ex: "Beșghioz, Bender, Bessarabia") |
  | `fatherGivenName` | `string` | Não | Nome do pai (ex: "Harlampe") |
  | `motherGivenName` | `string` | Não | Nome da mãe (ex: "Maria") |
* **Exemplo de Chamada POST:**
  ```json
  {
    "tool": "search_persons",
    "arguments": {
      "surname": "Colosovschi",
      "givenName": "Iwan",
      "birthDate": "18/10/1909",
      "birthPlace": "Beșghioz"
    }
  }
  ```
* **Retorno:** Lista de correspondências com `id`, `name`, `confidence`, `birthDate`, `birthPlace` e links GEDCOM X.

---

### 2. `get_tree_ancestors`
* **Finalidade:** Navega pela ascendência genealógica a partir de um indivíduo raiz no FamilySearch e realiza a detecção algorítmica de lacunas (gaps) na linhagem.
* **Parâmetros de Entrada:**
  | Campo | Tipo | Obrigatório | Descrição |
  | :--- | :--- | :--- | :--- |
  | `personId` | `string` | **Sim** | Identificador FamilySearch da pessoa raiz (ex: "KWQS-BB1" ou "LXYZ-123") |
  | `generations` | `number` | Não | Profundidade de gerações a explorar (padrão: 4, máx: 8) |
* **Exemplo de Chamada POST:**
  ```json
  {
    "tool": "get_tree_ancestors",
    "arguments": {
      "personId": "KWQS-BB1",
      "generations": 4
    }
  }
  ```
* **Retorno:** Objeto com `rootPersonId`, `totalAncestorsFound`, lista estruturada de ancestrais numerados e array `gaps` detalhando pessoas com dados faltantes e ações recomendadas.

---

### 3. `get_dgs_waypoints`
* **Finalidade:** Mapeia waypoints, processos arquivísticos e marcadores paroquiais contidos em rolos digitalizados de microfilmes (DGS).
* **Parâmetros de Entrada:**
  | Campo | Tipo | Obrigatório | Descrição |
  | :--- | :--- | :--- | :--- |
  | `dgsNumber` | `string` | **Sim** | Número do Grupo de Imagens DGS (ex: "005610797") |
* **Exemplo de Chamada POST:**
  ```json
  {
    "tool": "get_dgs_waypoints",
    "arguments": {
      "dgsNumber": "005610797"
    }
  }
  ```
* **Retorno:** Dados arquivísticos contendo Fundo, Opis, Processo (Delo), itens do microfilme e folhas de separação.

---

### 4. `analyze_manuscript_image`
* **Finalidade:** Submete uma imagem em alta resolução de um manuscrito ou fólio paroquial histórico para decifração paleográfica via **Google Gemini Vision**.
* **Parâmetros de Entrada:**
  | Campo | Tipo | Obrigatório | Descrição |
  | :--- | :--- | :--- | :--- |
  | `imageBase64` | `string` | **Sim** | Imagem do documento codificada em Base64 |
  | `language` | `string` | Não | Idioma/tradição paleográfica (ex: 'universal', 'portuguese', 'italian', 'spanish', 'latin', 'german', 'cyrillic_russian', 'romanian', 'french', 'polish', 'hebrew') |
  | `targetPerson` | `string` | Não | Nome procurado para correlacionar no texto transcrito |
  | `targetSurname` | `string` | Não | Sobrenome esperado no fólio |
  | `targetDate` | `string` | Não | Data aproximada do evento registrado |
  | `villageName` | `string` | Não | Paróquia, cartório ou comarca do registro |
  | `year` | `string` | Não | Ano de referência do livro de registro |
* **Retorno:** Objeto com `transcription` (texto integral decifrado), `confidenceScore`, `matchFound` (booleano) e `summary` estruturado para registro no Diário GPS.

---

## Outros Endpoints Especializados da Plataforma

### 5. `POST /api/audit/diagnosis`
* **Finalidade:** Gera diagnóstico estratégico de lacunas genealógicas utilizando o modelo **Gemini 3.5 Flash**.
* **Payload:** `{ rootPersonName: string, totalAncestors: number, generations: number, gaps: TreeAuditGap[] }`
* **Retorno:** Diagnóstico completo com avaliação de integridade da linhagem, priorização de certidões arquivísticas e roteiro de 3 passos no padrão GPS.

### 6. `GET / POST / DELETE /api/research-log`
* **Finalidade:** Camada de persistência local para o Diário de Pesquisa Genealógica (Genealogical Proof Standard).
* **Storage:** Arquivo `src/data/research-log.json`.
* **Métodos:**
  - `GET`: Retorna todas as entradas do log.
  - `POST`: Adiciona novo registro probatório com cálculo de confiança e timestamp.
  - `DELETE`: Remove registro específico por `id`.
