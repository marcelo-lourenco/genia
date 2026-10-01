import { parse } from "node-html-parser";
import type { DgsItem } from "@/services/familysearch/dgs";

export interface ParsedCatalogFilm {
  title: string;
  dgsNumber?: string;
  items: DgsItem[];
  totalImages?: number;
  notes?: string;
}

/**
 * Fast HTML parser for FamilySearch collection pages, catalog manifests, and film descriptions
 */
export function parseCatalogFilmHtml(html: string): ParsedCatalogFilm {
  const root = parse(html);

  // Extract collection/film title
  const titleElem = root.querySelector("h1, .film-title") || root.querySelector("title");
  const title = titleElem ? titleElem.text.trim() : "Coleção de Microfilmes FamilySearch";

  // Extract DGS number
  const dgsElem = root.querySelector("[data-dgs], .dgs-number, meta[name='dgs']");
  const dgsNumber = dgsElem?.getAttribute("data-dgs") || dgsElem?.text.trim();

  // Extract items/process tables (Delo / Opis / Fond / Paróquias)
  const items: DgsItem[] = [];
  const rows = root.querySelectorAll("tr, .item-row, .manifest-item");

  let currentItemIndex = 1;
  for (const row of rows) {
    const text = row.text.trim();
    if (!text || text.length < 5) continue;

    // Detect Delo (Process) e.g. "Дело 445" or "Processo 476"
    const deloMatch = text.match(/(?:дело|processo|delo)\s*([0-9]+)/i);
    // Detect Fond e.g. "Фонд 211"
    const fondMatch = text.match(/(?:фонд|fundo|fond)\s*([0-9]+)/i);
    // Detect Opis e.g. "Опись 2"
    const opisMatch = text.match(/(?:опись|inventário|inventario|opis)\s*([0-9]+)/i);
    // Detect Year
    const yearMatch = text.match(/\b(18[0-9]{2}|19[0-9]{2})\b/);

    if (deloMatch || fondMatch || opisMatch || text.includes("Item")) {
      items.push({
        itemNumber: currentItemIndex++,
        delo: deloMatch ? `Дело ${deloMatch[1]}` : undefined,
        fond: fondMatch ? `Фонд ${fondMatch[1]}` : undefined,
        opis: opisMatch ? `Опись ${opisMatch[1]}` : undefined,
        title: text.slice(0, 100).replace(/\s+/g, " "),
        year: yearMatch ? yearMatch[1] : undefined,
      });
    }
  }

  return {
    title,
    dgsNumber,
    items,
    totalImages: items.length > 0 ? items.length * 100 : undefined,
  };
}
