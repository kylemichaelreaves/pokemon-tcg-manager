import { test, expect, Page } from "@playwright/test";

/** Mock the /api/cards endpoint so the frontend doesn't hit the real backend. */
async function mockCardsApi(page: Page, cards: unknown[] = []): Promise<void> {
  await page.route("**/api/cards*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          data: cards,
          total: cards.length,
          page: 1,
          limit: 20,
          total_pages: cards.length > 0 ? 1 : 0,
        },
      }),
    });
  });
}

test.describe("Pokemon TCG Manager", () => {
  test("should display the page title and header", async ({ page }) => {
    await mockCardsApi(page);
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Pokémon TCG Manager");
    await expect(page.locator("h2")).toContainText("Card Catalog");
  });

  test("should have navigation links", async ({ page }) => {
    await mockCardsApi(page);
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Cards" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Collection" })).toBeVisible();
  });

  test("should toggle add to collection form", async ({ page }) => {
    await mockCardsApi(page);
    await page.goto("/");

    const toggleBtn = page.getByTestId("add-card-toggle");
    await expect(toggleBtn).toContainText("+ Add to Collection");

    await toggleBtn.click();
    await expect(page.getByTestId("add-card-form")).toBeVisible();
    await expect(toggleBtn).toContainText("Cancel");

    await toggleBtn.click();
    await expect(page.getByTestId("add-card-form")).not.toBeVisible();
  });

  test("should show empty state when no cards match", async ({ page }) => {
    await mockCardsApi(page);
    await page.goto("/");
    await expect(page.getByText("No cards match your filters")).toBeVisible();
  });

  test("should render cards from API", async ({ page }) => {
    await mockCardsApi(page, [
      {
        card_id: 1,
        name: "Charizard",
        set_name: "Pokemon 151",
        set_code: "MEW",
        card_number: "006/165",
        language: "EN",
        pokedex_number: 6,
        name_local: null,
        card_type: "Pokemon",
        energy_type: "Fire",
        rarity: "Rare",
        is_pokemon_ex: false,
        is_secret_rare: false,
        is_promo: false,
        has_holo_variant: true,
      },
    ]);

    await page.goto("/");
    await expect(page.getByText("Charizard")).toBeVisible();
    await expect(page.getByText("Fire")).toBeVisible();
    await expect(page.getByText("Pokemon 151 · #006/165")).toBeVisible();
  });

  test("should fill and submit add to collection form", async ({ page }) => {
    let addCalled = false;

    await mockCardsApi(page);

    await page.route("**/api/collection", async (route) => {
      if (route.request().method() === "POST") {
        addCalled = true;
        const body = route.request().postDataJSON();
        expect(body.card_id).toBe(42);
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { collection_id: 1, ...body },
          }),
        });
      }
    });

    await page.goto("/");
    await page.getByTestId("add-card-toggle").click();

    await page.getByTestId("card-id-input").fill("42");

    await page.getByTestId("submit-card-btn").click();

    await page.waitForTimeout(500);
    expect(addCalled).toBe(true);
  });
});
