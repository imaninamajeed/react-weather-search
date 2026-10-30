import { expect, test } from "@playwright/test";
import { seedPlaces } from "./helpers";

test("the dashboard opens on the default city with an onboarding prompt", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 2, name: "Subang Jaya" })).toBeVisible();
  await expect(page.getByText("Nothing Saved Yet")).toBeVisible();
  await expect(page.getByText("Warm and humid.")).toBeVisible();
});

test("search finds a city from the keyboard and shows its own local time", async ({ page }) => {
  await page.goto("/dashboard");
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
  await page.goto("/dashboard");
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

  // The Locations page has Home on its own tab and the other saved locations on the next.
  await page.goto("/places");
  const cards = page.locator("article:visible h3");
  await expect(cards).toHaveText(["Subang Jaya"]);
  await page.getByRole("tab", { name: /Saved Locations/ }).click();
  await expect(page.getByRole("button", { name: "7-day details for Tokyo" })).toBeVisible();

  // Make Tokyo the home place: it moves to the Home tab, leads the dashboard, and is no longer
  // repeated as a card there.
  await page.getByRole("button", { name: "Actions for Tokyo" }).click();
  await page.getByRole("menuitem", { name: "Set as Home" }).click();
  // Let the action finish before navigating away, or it is cancelled mid-flight.
  await expect(page.getByText("Tokyo is now your home")).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 2, name: "Tokyo" }).first()).toBeVisible();
  await expect(page.locator("article:visible h3")).toHaveText(["Subang Jaya"]);

  // Remove, then undo: the place returns to the saved list.
  await page.goto("/places");
  await page.getByRole("tab", { name: /Saved Locations/ }).click();
  await page.getByRole("button", { name: "Actions for Subang Jaya" }).click();
  await page.getByRole("menuitem", { name: "Remove" }).click();
  await expect(page.getByText("Removed Subang Jaya")).toBeVisible();
  // Scope to this toast: earlier "Saved …" toasts also carry an Undo button.
  await page
    .locator("[data-sonner-toast]", { hasText: "Removed Subang Jaya" })
    .getByRole("button", { name: "Undo" })
    .click();
  await expect(page.getByRole("button", { name: "7-day details for Subang Jaya" })).toBeVisible();
});

test("undoing the removal of the home place restores its home status", async ({ page }) => {
  await page.goto("/place/1850147-tokyo");
  await page.getByRole("button", { name: "Set as Home" }).click();
  await expect(page.getByText("Tokyo is now your home")).toBeVisible();

  await page.goto("/places");
  await page.getByRole("button", { name: "Actions for Tokyo" }).click();
  await page.getByRole("menuitem", { name: "Remove" }).click();
  await expect(page.getByText("Removed Tokyo")).toBeVisible();
  await page
    .locator("[data-sonner-toast]", { hasText: "Removed Tokyo" })
    .getByRole("button", { name: "Undo" })
    .click();
  await expect(page.locator("article:visible h3")).toHaveText(["Tokyo"]);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 2, name: "Tokyo" }).first()).toBeVisible();
});

test.describe("dashboard versus places", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await seedPlaces(context, baseURL!);
  });

  test("the dashboard is a glance: no home repeat, no management, no comparison table", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Subang Jaya is home (the hero), so only Tokyo is a status card.
    await expect(page.locator("article:visible h3")).toHaveText(["Tokyo"]);
    await expect(page.getByRole("button", { name: /^Move / })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /Saved Locations/ })).toHaveCount(0);

    await page.getByRole("main").getByRole("link", { name: "Locations", exact: true }).click();
    await expect(page).toHaveURL(/\/places$/);
  });

  test("the places page manages and compares", async ({ page }) => {
    await page.goto("/places");
    await expect(page.getByRole("heading", { level: 1, name: "Locations" })).toBeVisible();
    // Home leads on its own tab, with its conditions and its seven days.
    await expect(page.locator("article:visible h3")).toHaveText(["Subang Jaya"]);
    await expect(page.locator("article:visible").first().getByRole("listitem")).toHaveCount(7);

    // The other saved locations are square tiles; a click opens their seven days, not the place.
    await page.getByRole("tab", { name: /Saved Locations/ }).click();
    await expect(page.getByRole("button", { name: "Actions for Tokyo" })).toBeVisible();
    await page.getByRole("button", { name: "7-day details for Tokyo" }).click();
    await expect(page).toHaveURL(/\/places$/);
    const dialog = page.getByRole("dialog", { name: "Tokyo" });
    await expect(dialog.getByRole("listitem")).toHaveCount(7);
    await expect(dialog.getByRole("link", { name: "Full Forecast" })).toBeVisible();
  });

  test("the old manage link redirects to the places page", async ({ page }) => {
    await page.goto("/dashboard?manage=1");
    await expect(page).toHaveURL(/\/places$/);
  });
});

test("the dashboard says how to add a second place when only home is followed", async ({
  page,
}) => {
  await page.goto("/place/8504423-subang-jaya");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved Subang Jaya")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText(/only one you follow so far/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a Place" })).toBeVisible();
});

test("units switch between metric and imperial and persist", async ({ page }) => {
  await page.goto("/place/8504423-subang-jaya");
  const units = page.getByRole("radiogroup", { name: "Units" });
  await expect(units.getByRole("radio", { name: /Metric/ })).toBeChecked();
  await expect(page.getByText(/km\/h/).filter({ visible: true }).first()).toBeVisible();

  await units.getByRole("radio", { name: /Imperial/ }).click();
  await expect(units.getByRole("radio", { name: /Imperial/ })).toBeChecked();
  await expect(page.getByText(/mph/).filter({ visible: true }).first()).toBeVisible();

  await page.reload();
  await expect(units.getByRole("radio", { name: /Imperial/ })).toBeChecked();
  await expect(page.getByText(/mph/).filter({ visible: true }).first()).toBeVisible();
});

test.describe("first-visit units", () => {
  test.use({ locale: "en-US" });

  test("default to imperial for US browsers until the visitor chooses", async ({ page }) => {
    await page.goto("/place/8504423-subang-jaya");
    const units = page.getByRole("radiogroup", { name: "Units" });
    await expect(units.getByRole("radio", { name: /Imperial/ })).toBeChecked();
    await expect(page.getByText(/mph/).filter({ visible: true }).first()).toBeVisible();

    await units.getByRole("radio", { name: /Metric/ }).click();
    await expect(units.getByRole("radio", { name: /Metric/ })).toBeChecked();
    await expect(page.getByText(/km\/h/).filter({ visible: true }).first()).toBeVisible();
  });
});

// Needs two saved locations besides home, and the seeded fixture has one.
test.fixme("dragging a card to another slot reorders your places, and the order is kept", async ({
  page,
  context,
  baseURL,
}) => {
  await seedPlaces(context, baseURL!);
  await page.goto("/places");
  const cards = page.locator("article:visible");
  const names = page.locator("article:visible h3");
  await expect(names).toHaveText(["Subang Jaya", "Tokyo"]);

  // Pick up Subang Jaya by its card and drop it on Tokyo's slot.
  const from = (await cards.nth(0).boundingBox())!;
  const to = (await cards.nth(1).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + 40);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await expect(names).toHaveText(["Tokyo", "Subang Jaya"]);
  await page.mouse.up();

  // Letting go saves it: still in this order after a reload, and the drag did not open a card.
  await expect(page).toHaveURL(/\/places$/);
  await page.reload();
  await expect(names).toHaveText(["Tokyo", "Subang Jaya"]);
});
