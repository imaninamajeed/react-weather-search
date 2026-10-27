import { expect, test } from "@playwright/test";
import { mockMapNetwork, seedPlaces } from "./helpers";

test.describe("desktop", () => {
  test("lists navigation and your places, and highlights where you are", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedPlaces(context, baseURL!);
    await page.goto("/place/1850147-tokyo");

    const sidebar = page.locator('[data-slot="sidebar"]').first();
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Alerts" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Places" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Radar map" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Subang Jaya" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Tokyo" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(sidebar.getByRole("link", { name: "Subang Jaya" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );

    await sidebar.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("shows the default home place when nothing is saved", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar"]').first();
    await expect(sidebar.getByRole("link", { name: "Subang Jaya" })).toBeVisible();
    await expect(sidebar.getByText("Save a place from its forecast page")).toBeVisible();
  });

  test("collapses to icons with the keyboard and remembers it", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator('[data-slot="sidebar"]').first();
    await expect(sidebar).toHaveAttribute("data-state", "expanded");

    await page.keyboard.press("Control+b");
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");

    await page.reload();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");

    // The trigger, not the drag rail (which shares its label).
    await page.locator('[data-slot="sidebar-trigger"]').click();
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("is a drawer that closes when you navigate", async ({ page }) => {
    await mockMapNetwork(page);
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Radar map" })).toBeHidden();

    await page.getByRole("button", { name: "Toggle sidebar" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await drawer.getByRole("link", { name: "Radar map" }).click();
    await expect(page).toHaveURL(/\/map$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
