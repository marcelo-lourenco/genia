import assert from "node:assert/strict";
import test from "node:test";
import { parseCatalogFilmHtml } from "@/services/scraper/html-parser";

test("parseCatalogFilmHtml extracts Delo, Fond, Opis, Year and title from HTML", () => {
  const sampleHtml = `
    <html>
      <head><title>Moldova, Church Books, 1811-1936</title></head>
      <body>
        <h1 class="film-title">Registros paroquiais do distrito de Bender</h1>
        <div data-dgs="005610797"></div>
        <table>
          <tr class="item-row">
            <td>Item 1: Fundo 211, Inventário 2, Processo 444, Ano 1909</td>
          </tr>
          <tr class="item-row">
            <td>Item 2: Фонд 211 / Опись 2 / Дело 445 - 1909</td>
          </tr>
          <tr class="item-row">
            <td>Item 3: Фонд 211, Опись 2, Дело 476, Beșghioz (Sf. Mihail) - Folhas 327-378</td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const parsed = parseCatalogFilmHtml(sampleHtml);

  assert.equal(parsed.title, "Registros paroquiais do distrito de Bender");
  assert.equal(parsed.dgsNumber, "005610797");
  assert.equal(parsed.items.length, 3);

  // Check Item 2
  assert.equal(parsed.items[1].delo, "Дело 445");
  assert.equal(parsed.items[1].fond, "Фонд 211");
  assert.equal(parsed.items[1].opis, "Опись 2");
  assert.equal(parsed.items[1].year, "1909");

  // Check Item 3 (target process for Beșghioz)
  assert.equal(parsed.items[2].delo, "Дело 476");
  assert.ok(parsed.items[2].title.includes("Beșghioz"));
});
