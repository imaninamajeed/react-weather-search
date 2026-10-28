import { expect, test } from "@playwright/test";
import { expectNoSeriousViolations, mockMapNetwork, seedPlaces } from "./helpers";

test.beforeEach(async ({ context, baseURL }) => {
  await seedPlaces(context, baseURL!);
});

test.describe("desktop", () => {
  test("shows where you are, with links back up", async ({ page }) => {
    await page.goto("/place/8504423-subang-jaya/outlook");
    const trail = page.getByRole("navigation", { name: "breadcrumb" });

    await expect(trail.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(trail.getByRole("link", { name: "Places" })).toBeVisible();
    await expect(trail.getByRole("link", { name: "Subang Jaya" })).toHaveAttribute(
      "href",
      "/place/8504423-subang-jaya",
    );
    // The current view is marked as the page and is not navigable (shadcn renders it as a disabled link).
    const current = trail.getByText("Outlook");
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(current).toHaveAttribute("aria-disabled", "true");
    await expect(current).not.toHaveAttribute("href");

    await trail.getByRole("link", { name: "Places" }).click();
    await expect(page).toHaveURL(/\/places$/);
  });

  test("the dropdown switches place and keeps the view you are on", async ({ page }) => {
    await page.goto("/place/8504423-subang-jaya/outlook");
    await page.getByRole("button", { name: "Switch place" }).click();

    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: /Subang Jaya/ })).toContainText("Current");
    await expect(menu.getByRole("menuitem", { name: "All places" })).toBeVisible();

    await menu.getByRole("menuitem", { name: "Tokyo" }).click();
    await expect(page).toHaveURL(/\/place\/1850147-tokyo\/outlook$/);
    await expect(page.getByRole("heading", { level: 1, name: "Tokyo" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "breadcrumb" }).getByText("Outlook"),
    ).toBeVisible();
  });

  test("includes the place you are viewing even when it isn't saved", async ({ page }) => {
    // A dropped pin: not saved, but still listed as where you are.
    await page.goto("/place/51.51,-0.13");
    await page.getByRole("button", { name: "Switch place" }).click();
    await expect(page.getByRole("menuitem", { name: /51\.51/ })).toContainText("Current");
    await expect(page.getByRole("menuitem", { name: "Tokyo" })).toBeVisible();
  });

  test("top-level pages have a short trail", async ({ page }) => {
    await page.goto("/places");
    const trail = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(trail.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(trail.getByText("Places")).toHaveAttribute("aria-current", "page");

    await mockMapNetwork(page);
    await page.goto("/map");
    await expect(
      page.getByRole("navigation", { name: "breadcrumb" }).getByText("Radar map"),
    ).toHaveAttribute("aria-current", "page");
  });

  test("sits in its own row under the top bar, on every page including the dashboard", async ({
    page,
  }) => {
    await page.goto("/");
    const trail = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(trail.getByText("Dashboard")).toHaveAttribute("aria-current", "page");

    // It follows you as you move, and the page body doesn't repeat it.
    await page.goto("/place/8504423-subang-jaya/history");
    await expect(trail.getByText("Climate")).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("navigation", { name: "breadcrumb" }),
    ).toHaveCount(0);

    // Client-side navigation updates it too.
    await page.getByRole("banner").getByRole("link", { name: "Places" }).click();
    await expect(page).toHaveURL(/\/places$/);
    await expect(trail.getByText("Places")).toHaveAttribute("aria-current", "page");
  });

  test("the open dropdown is accessible", async ({ page }) => {
    await page.goto("/place/8504423-subang-jaya");
    await page.getByRole("button", { name: "Switch place" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expectNoSeriousViolations(page);
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the header fits a phone: icon-only search, no horizontal scroll", async ({ page }) => {
    await page.goto("/place/8504423-subang-jaya/outlook");
    await expect(page.getByRole("button", { name: "Search places" })).toBeVisible();
    await expect(page.getByText("Search places", { exact: true })).toBeHidden(); // the label, not the button name
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("folds earlier levels into an ellipsis dropdown", async ({ page }) => {
    await page.goto("/place/8504423-subang-jaya/outlook");
    const trail = page.getByRole("navigation", { name: "breadcrumb" });

    // Only the last two levels stay on screen.
    await expect(trail.getByRole("link", { name: "Places" })).toBeHidden();
    await expect(trail.getByRole("link", { name: "Subang Jaya" })).toBeVisible();

    await trail.getByRole("button", { name: "Show earlier levels" }).click();
    await page.getByRole("menuitem", { name: "Places" }).click();
    await expect(page).toHaveURL(/\/places$/);
  });
});
