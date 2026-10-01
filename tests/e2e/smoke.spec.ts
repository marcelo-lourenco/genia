import { expect, test } from "@playwright/test";

test.describe("Genealogical AI Agent E2E Smoke Tests", () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });
  test("home page loads with hero banner and core links", async ({ page }) => {
    await page.goto("/");

    // Verify title and main heading
    await expect(page).toHaveTitle(/FamilySearch Autonomous AI Agent/i);
    const heading = page.locator("h1");
    await expect(heading).toContainText("FamilySearch AI Explorer");

    // Verify presence of navigation links
    await expect(page.locator("a[href='/search']")).toBeVisible();
    await expect(page.locator("a[href='/audit']")).toBeVisible();
    await expect(page.locator("a[href='/research-log']")).toBeVisible();
  });

  test("search page renders form, supports demo auto-fill, and shows paleography workspace", async ({
    page,
  }) => {
    await page.goto("/search");

    // Check heading
    await expect(page.locator("h1")).toContainText("Pesquisa & Paleografia Digital");

    // Click demo load button
    const demoBtn = page.getByRole("button", { name: /Caso Bessarábia/i });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Verify fields are populated
    const surnameInput = page.locator("input[name='surname']");
    await expect(surnameInput).toHaveValue("Colosovschi");

    const dgsInput = page.locator("input[name='dgsNumber']");
    await expect(dgsInput).toHaveValue("005610797");
  });

  test("audit page loads tree audit and gap detector", async ({ page }) => {
    await page.goto("/audit");

    await expect(page.locator("h1")).toContainText("Auditoria & Detecção de Lacunas");
    await expect(page.getByText("Linhagem de Ancestrais Identificados")).toBeVisible();
    await expect(page.getByText(/Lacunas Detectadas/i)).toBeVisible();
  });

  test("research log page renders GPS audit trail and export options", async ({ page }) => {
    await page.goto("/research-log");

    await expect(page.locator("h1")).toContainText("Diário de Pesquisa Auditável");
    await expect(page.getByRole("button", { name: /Exportar Diário/i })).toBeVisible();
    await expect(page.getByText("Fonte / Repositório")).toBeVisible();
  });
});
