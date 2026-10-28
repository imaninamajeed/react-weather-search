import { expect, test } from "@playwright/test";
import { mockMapNetwork, seedPlaces } from "./helpers";

test.describe("desktop", () => {
  test("the top bar lists the destinations and highlights where you are", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("banner").getByRole("navigation", { name: "Main" });
    for (const name of ["Dashboard", "Alerts", "Places", "Map"]) {
      await expect(nav.getByRole("link", { name })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await nav.getByRole("link", { name: "Alerts" }).click();
    await expect(page).toHaveURL(/\/alerts$/);
    await expect(nav.getByRole("link", { name: "Alerts" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("a place's own pages don't highlight a destination", async ({ page, context, baseURL }) => {
    await seedPlaces(context, baseURL!);
    await page.goto("/place/1850147-tokyo");
    const nav = page.getByRole("banner").getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Places" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("there is no bottom tab bar", async ({ page }) => {
    await page.goto("/");
    // Hidden elements aren't in the accessibility tree, so only the top bar's nav is found.
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
    await expect(page.getByRole("banner").getByRole("navigation", { name: "Main" })).toBeVisible();
  });

  test("the places menu jumps to the home place or a saved one", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedPlaces(context, baseURL!);
    await page.goto("/place/1850147-tokyo");

    await page.getByRole("button", { name: "Your places" }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: /Tokyo/ })).toContainText("Current");
    await expect(menu.getByRole("menuitem", { name: /Subang Jaya/ })).not.toContainText("Current");
    await expect(menu.getByRole("menuitem", { name: "All places" })).toBeVisible();

    await menu.getByRole("menuitem", { name: /Subang Jaya/ }).click();
    await expect(page).toHaveURL(/\/place\/8504423-subang-jaya$/);
  });

  test("the places menu shows the default home place when nothing is saved", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Your places" }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Subang Jaya" })).toBeVisible();
    await expect(menu.getByText("Save a place from its forecast page")).toBeVisible();
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a bottom tab bar replaces the top-bar links and the places menu", async ({ page }) => {
    await mockMapNetwork(page);
    await page.goto("/");

    const tabs = page.getByRole("navigation", { name: "Main" });
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("button", { name: "Your places" })).toBeHidden();

    // One tap to get anywhere.
    await tabs.getByRole("link", { name: "Map" }).click();
    await expect(page).toHaveURL(/\/map$/);
    await expect(tabs.getByRole("link", { name: "Map" })).toHaveAttribute("aria-current", "page");
  });

  test("the tab bar doesn't cover the end of the page or add horizontal scroll", async ({
    page,
  }) => {
    await page.goto("/");
    const tabs = page.getByRole("navigation", { name: "Main" });
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();

    const footer = await page.getByRole("contentinfo").boundingBox();
    const bar = await tabs.boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(bar!.y + 1);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
