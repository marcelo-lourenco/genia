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
