# Mapeamento da API do FamilySearch (FAMILYSEARCH_API.md)

## 1. Ambientes e URLs Base
* **Sandbox / Integração:**
  - Base API: `https://api-integ.familysearch.org`
  - OAuth Identity: `https://identbeta.familysearch.org`
* **Produção:**
  - Base API: `https://api.familysearch.org`
  - OAuth Identity: `https://ident.familysearch.org`

## 2. Autenticação OAuth2 (PKCE)
* **Endpoints:**
  - Autorização: `GET /cis-web/oauth2/v3/authorization`
  - Troca de Token: `POST /cis-web/oauth2/v3/token`
* **Parâmetros de Requisição de Token:**
  - `grant_type`: `authorization_code` | `refresh_token`
  - `client_id`: Developer App Key
  - `code_verifier`: String gerada para PKCE
  - `redirect_uri`: URL registrada do cliente
* **Headers Padrão:**
  - `Authorization: Bearer <access_token>`
  - `Accept: application/x-gedcomx-v1+json`

## 3. Endpoints Principais (Árvore Familiar e Registros)
1. **Busca de Pessoas:**
   - `GET /platform/tree/search?q=givenName:Ivan+surname:Colosovschi+birthDate:1909`
   - Retorna: `200 OK` com `Gedcomx` contendo `entries` com `confidence` score.
2. **Obter Pessoa:**
   - `GET /platform/tree/persons/{personId}`
   - Retorna os dados completos do indivíduo (`names`, `gender`, `facts`, etc.).
3. **Ascendência da Árvore (Ancestry):**
   - `GET /platform/tree/ancestry?person={personId}&generations=4`
   - Retorna lista de ascendentes estruturada em gerações.
4. **Fontes de uma Pessoa:**
   - `GET /platform/tree/persons/{personId}/sources`
   - Retorna referências e citações arquivísticas já atreladas.
5. **Livros e Catálogo de Registros Digitais (DGS):**
   - Catálogo de coleções: `/platform/records/collections`
   - Resolução de waypoints de microfilmes históricos: `/platform/records/images/waypoints`

## 4. Estrutura de Dados GEDCOM X
O FamilySearch utiliza o padrão **GEDCOM X JSON**. A estrutura mínima de uma Pessoa é:
```json
{
  "persons": [
    {
      "id": "ABCD-123",
      "names": [
        {
          "nameForms": [
            {
              "fullText": "Iwan Colosovschi",
              "parts": [
                { "type": "http://gedcomx.org/Given", "value": "Iwan" },
                { "type": "http://gedcomx.org/Surname", "value": "Colosovschi" }
              ]
            }
          ]
        }
      ],
      "facts": [
        {
          "type": "http://gedcomx.org/Birth",
          "date": { "original": "18 October 1909" },
          "place": { "original": "Beșghioz, Bender, Bessarabia" }
        }
      ]
    }
  ]
}
```

---

## 5. Limites Oficiais de Requisição e Rate Limiting (FamilySearch API)
* **Código HTTP de Limitação:** O FamilySearch sinaliza restrições exclusivamente via **`HTTP 429 Too Many Requests`** (nunca 503).
* **Header de Controle:** Em respostas 429, a API envia o cabeçalho `Retry-After: <segundos>`, indicando o tempo exato de espera antes da próxima requisição.
* **Limites Médios por Ambiente:**
  - **Produção:** ~15 a 20 requisições por segundo por token de usuário/Developer Key, com suporte a rajadas curtas (*burst*).
  - **Sandbox / Integração:** Entre 1.000 a 5.000 chamadas diárias e ~10 req/s, variando com o nível da chave de desenvolvedor.
* **Risco de Bloqueio:** O FamilySearch **não bloqueia permanentemente** nem cancela contas por atingir o limite de taxa rotineiro. Ele apenas suspende temporariamente novas respostas pelo período estipulado em `Retry-After`. Bloqueios só ocorrem em violações extremas de Termos de Uso (ex: scraping massivo de pessoas vivas ou DDoS).
* **Mitigação Nativa no Sistema (`src/services/familysearch/client.ts`):**
  - Algoritmo de **Exponential Backoff com Jitter** já ativo no cliente HTTP.
  - Ao receber `HTTP 429`, o cliente respeita `Retry-After`, aguarda o intervalo com aleatoriedade e reexecuta a chamada até 3 vezes de forma transparente.

---

## 6. Diferença Crítica: Erro 503 (Gemini) vs Erro 429 (FamilySearch)
* **Erro `HTTP 503 UNAVAILABLE ("This model is currently experiencing high demand")`:**
  - Origem: **Google Gemini API**, referente à infraestrutura de inferência de IA em momentos de pico de tráfego mundial.
  - Não consome tokens, não deduz da cota da chave e não tem qualquer relação com o FamilySearch.
  - Mitigado via **Cascata de Modelos** (Failover automático para `gemini-3.5-flash-lite` / `gemini-flash-lite-latest`) em `src/app/api/audit/diagnosis/route.ts`.

