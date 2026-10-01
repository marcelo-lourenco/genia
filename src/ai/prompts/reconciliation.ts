export interface ReconciliationInput {
  claimedPerson: {
    givenName: string;
    surname: string;
    birthDate?: string;
    birthPlace?: string;
    fatherName?: string;
    motherName?: string;
  };
  candidateRecord: {
    extractedName: string;
    extractedSurname: string;
    extractedDate?: string;
    extractedPlace?: string;
    extractedFather?: string;
    extractedMother?: string;
    sourceDocument: string;
  };
}

export function buildReconciliationPrompt(input: ReconciliationInput): string {
  return `Você é um Árbitro Genealógico Sênior atuando sob o Genealogical Proof Standard (GPS).

Sua missão é correlacionar os dados informados pelo pesquisador com os dados extraídos de uma fonte histórica original para determinar se representam a mesma pessoa física.

### Dados Fornecidos pelo Pesquisador:
- Nome: ${input.claimedPerson.givenName} ${input.claimedPerson.surname}
- Data de Nascimento: ${input.claimedPerson.birthDate || "Não informada"}
- Local de Nascimento: ${input.claimedPerson.birthPlace || "Não informado"}
- Pais: Pai: ${input.claimedPerson.fatherName || "?"} | Mãe: ${input.claimedPerson.motherName || "?"}

### Dados Extraídos da Fonte Histórica:
- Nome na Fonte: ${input.candidateRecord.extractedName} ${input.candidateRecord.extractedSurname}
- Data na Fonte: ${input.candidateRecord.extractedDate || "Não informada"}
- Local na Fonte: ${input.candidateRecord.extractedPlace || "Não informado"}
- Pais na Fonte: Pai: ${input.candidateRecord.extractedFather || "?"} | Mãe: ${input.candidateRecord.extractedMother || "?"}
- Documento: ${input.candidateRecord.sourceDocument}

### Análise Requerida:
1. **Equivalência Fonética e Translaboração:**
   - Avalie as variações ortográficas linguísticas (Ex: Ivan vs. Iwan vs. João; Colosovschi vs. Colosovski vs. Kolosovsky / Колосовский).
2. **Equivalência Cronológica:**
   - Considere a diferença de 13 dias entre o Calendário Juliano (usado na Rússia/Bessarábia até 1918) e o Calendário Gregoriano (usado no Brasil e Ocidente).
3. **Equivalência de Filiação e Localidade:**
   - Avalie se a coincidência de pais e paróquia consolida a identificação além de dúvida razoável.

### Saída Estruturada JSON Obrigatória:
Retorne exclusivamente um JSON no seguinte formato:
{
  "isMatch": true | false,
  "confidenceScore": number (0.0 a 1.0),
  "phoneticSimilarity": number (0.0 a 1.0),
  "dateCorrelation": "exact" | "julian_gregorian_shift" | "approximate" | "conflict",
  "resolutionSummary": "string concisa com o veredito GPS",
  "researchLogEntry": "string pronta para ser gravada no Diário de Pesquisa"
}`;
}
