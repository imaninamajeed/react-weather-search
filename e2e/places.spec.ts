import { expect, test } from "@playwright/test";

test("the dashboard opens on the default city with an onboarding prompt", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2, name: "Subang Jaya" })).toBeVisible();
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
  await expect(page.getByText("Warm and humid.")).toBeVisible();
});

test("search finds a city from the keyboard and shows its own local time", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("/");
  await page.getByPlaceholder("Search a city…").fill("tok");
  await expect(page.getByRole("option", { name: /Tokyo/ }).first()).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/place\/1850147-tokyo$/);
  await expect(page.getByRole("heading", { level: 1, name: "Tokyo" })).toBeVisible();
  // Timezone comes from the forecast, not from the viewer's browser.
  await expect(page.getByText(/local time \(UTC\+9\)/)).toBeVisible();
});

test("search explains an empty result and an upstream failure", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("/");
  const input = page.getByPlaceholder("Search a city…");

  await input.fill("zzzz");
  await expect(page.getByText("No places match “zzzz”.")).toBeVisible();

  await input.fill("boom");
  await expect(page.getByText(/Search is unavailable right now/)).toBeVisible();
});

test("saving, setting home, reordering and removing with undo", async ({ page }) => {
  // Save Tokyo and Subang Jaya.
  await page.goto("/place/1850147-tokyo");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved Tokyo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");

  await page.goto("/place/8504423-subang-jaya");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved Subang Jaya")).toBeVisible();

  // They appear on the dashboard in the order saved.
  await page.goto("/");
  const cards = page.locator("article:visible h3");
  await expect(cards).toHaveText(["Tokyo", "Subang Jaya"]);

  // Reorder in manage mode.
  await page.getByRole("link", { name: "Manage" }).click();
  await page.getByRole("button", { name: "Move Subang Jaya up" }).click();
  await expect(cards).toHaveText(["Subang Jaya", "Tokyo"]);

  // Make Tokyo the home place: it leads the dashboard.
  await page.getByRole("button", { name: "Set as home" }).first().click();
  await expect(page.getByRole("heading", { level: 2, name: "Tokyo" }).first()).toBeVisible();

  // Remove, then undo: the place returns to the same position.
  await page.getByRole("button", { name: "Remove" }).first().click();
  await expect(page.getByText("Removed Subang Jaya")).toBeVisible();
  await expect(cards).toHaveText(["Tokyo"]);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(cards).toHaveText(["Subang Jaya", "Tokyo"]);
});

test("undoing the removal of the home place restores its home status", async ({ page }) => {
  await page.goto("/place/1850147-tokyo");
  await page.getByRole("button", { name: "Set as home" }).click();
  await expect(page.getByText("Tokyo is now your home")).toBeVisible();

  await page.goto("/?manage=1");
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Removed Tokyo")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("article:visible h3")).toHaveText(["Tokyo"]);
  await expect(page.getByRole("heading", { level: 2, name: "Tokyo" }).first()).toBeVisible();
});

test("units switch between metric and imperial and persist", async ({ page }) => {
  await page.goto("/place/8504423-subang-jaya");
  await expect(page.getByText("°C", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("menuitemradio", { name: /Imperial/ }).click();
  await expect(page.getByText("°F", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/mph/).first()).toBeVisible();

  await page.reload();
  await expect(page.getByText("°F", { exact: true }).first()).toBeVisible();
});
