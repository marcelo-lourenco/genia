/**
 * Phonetic Matching & Genealogical Name Proximity Engine
 * Tailored for Eastern European (Cyrillic, Romanian, Latin) genealogical records.
 * Supports cross-alphabet equivalence (e.g., Colosovschi <-> Колосовский <-> Kolosovsky).
 */

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  // Pre-1918 Archaic letters
  ѣ: "e", // Yat
  і: "i", // Dotted I
  ѳ: "f", // Fita
  ѵ: "i", // Izhitsa
};

/**
 * Transliterates Cyrillic text to normalized lowercase Latin characters
 */
export function transliterateCyrillic(text: string): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  let result = "";
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    result += CYRILLIC_TO_LATIN_MAP[char] ?? char;
  }
  return result;
}

/**
 * Normalizes European phonetic variations in historical surnames
 * (e.g., 'sch' -> 'sh', 'cz' -> 'ts', 'w' -> 'v', 'tz' -> 'ts')
 */
export function normalizeGenealogicalPhonetics(name: string): string {
  return transliterateCyrillic(name)
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/[î]/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/schi$/g, "ski")
    .replace(/scky$/g, "ski")
    .replace(/skiy$/g, "ski")
    .replace(/sky$/g, "ski")
    .replace(/ski/g, "sk")
    .replace(/sch/g, "sh")
    .replace(/ovs/g, "ofs")
    .replace(/ff$/g, "v")
    .replace(/off$/g, "ov")
    .replace(/w/g, "v")
    .replace(/ph/g, "f")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/c(?=[aou])/g, "k")
    .replace(/qu/g, "k")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Standard Soundex algorithm for phonetic indexing
 */
export function soundex(str: string): string {
  const norm = normalizeGenealogicalPhonetics(str);
  if (!norm) return "0000";

  const firstLetter = norm[0].toUpperCase();
  const codes: Record<string, string> = {
    b: "1",
    f: "1",
    p: "1",
    v: "1",
    c: "2",
    g: "2",
    j: "2",
    k: "2",
    q: "2",
    s: "2",
    x: "2",
    z: "2",
    d: "3",
    t: "3",
    l: "4",
    m: "5",
    n: "5",
    r: "6",
  };

  let soundexStr = firstLetter;
  let prevCode = codes[norm[0]] || "0";

  for (let i = 1; i < norm.length && soundexStr.length < 4; i++) {
    const code = codes[norm[i]] || "0";
    if (code !== "0" && code !== prevCode) {
      soundexStr += code;
    }
    prevCode = code;
  }

  return `${soundexStr}0000`.slice(0, 4);
}

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[bLen][aLen];
}

export interface ProximityResult {
  similarity: number; // 0.0 to 1.0
  phoneticMatch: boolean;
  normalizedA: string;
  normalizedB: string;
  soundexA: string;
  soundexB: string;
  rationale: string;
}

/**
 * Calculates proximity between two genealogical names across languages/alphabets
 */
export function calculateNameProximity(nameA: string, nameB: string): ProximityResult {
  const normA = normalizeGenealogicalPhonetics(nameA);
  const normB = normalizeGenealogicalPhonetics(nameB);

  const soundA = soundex(nameA);
  const soundB = soundex(nameB);
  const phoneticMatch = soundA === soundB;

  if (!normA || !normB) {
    return {
      similarity: 0,
      phoneticMatch: false,
      normalizedA: normA,
      normalizedB: normB,
      soundexA: soundA,
      soundexB: soundB,
      rationale: "Um dos nomes está vazio",
    };
  }

  if (normA === normB) {
    return {
      similarity: 1.0,
      phoneticMatch: true,
      normalizedA: normA,
      normalizedB: normB,
      soundexA: soundA,
      soundexB: soundB,
      rationale: "Correspondência exata após normalização fonética (alta proximidade)",
    };
  }

  const maxLen = Math.max(normA.length, normB.length);
  const distance = levenshteinDistance(normA, normB);
  const rawSimilarity = 1 - distance / maxLen;

  // Bonus for matching soundex or prefix/stem
  let similarity = rawSimilarity;
  if (phoneticMatch) {
    similarity = Math.min(1.0, similarity + 0.15);
  }

  // Handle common Slavic patronymic / adjectival endings (-schi, -sky, -ov)
  if (normA.startsWith(normB.slice(0, 4)) || normB.startsWith(normA.slice(0, 4))) {
    similarity = Math.min(1.0, similarity + 0.1);
  }

  const roundedSimilarity = Math.round(similarity * 100) / 100;

  return {
    similarity: roundedSimilarity,
    phoneticMatch,
    normalizedA: normA,
    normalizedB: normB,
    soundexA: soundA,
    soundexB: soundB,
    rationale:
      roundedSimilarity >= 0.85
        ? "Alta proximidade fonética e ortográfica (provável variante do mesmo sobrenome)"
        : roundedSimilarity >= 0.65
          ? "Média proximidade fonética (possível variante regional/transliterada)"
          : "Baixa proximidade fonética",
  };
}
