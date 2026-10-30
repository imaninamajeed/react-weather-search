import { expect, test } from "@playwright/test";
import { mockMapNetwork, seedPlaces } from "./helpers";

test.describe("desktop", () => {
  test("the sidebar lists the destinations and highlights where you are", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Main" });
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
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Places" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("there is no bottom tab bar", async ({ page }) => {
    await page.goto("/dashboard");
    // Hidden elements aren't in the accessibility tree, so only the sidebar's nav is found.
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  });

  test("the sidebar lists your places with their weather, and switching keeps the view you are on", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedPlaces(context, baseURL!);
    await page.goto("/place/1850147-tokyo/outlook");

    const places = page.getByRole("navigation", { name: "Your Places" });
    await expect(places.getByRole("link", { name: "Tokyo" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(places.getByRole("link", { name: "Subang Jaya" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );

    await places.getByRole("link", { name: "Subang Jaya" }).click();
    await expect(page).toHaveURL(/\/place\/8504423-subang-jaya\/outlook$/);
    await expect(places.getByRole("link", { name: "Subang Jaya" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("each place in the sidebar shows its current weather", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedPlaces(context, baseURL!);
    await page.goto("/dashboard");
    const places = page.getByRole("navigation", { name: "Your Places" });
    const home = places.getByRole("link", { name: /Subang Jaya/ });
    await expect(home).toContainText("Home");
    await expect(home).toContainText(/\d+°/);
    await expect(places.getByRole("link", { name: /Tokyo/ })).toContainText(/\d+°/);
  });

  test("the sidebar's add button opens search", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Follow Another Place" }).click();
    await expect(page.getByPlaceholder("Search a city…")).toBeVisible();
  });

  test("the command palette jumps to your places and to the app's pages", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedPlaces(context, baseURL!);
    await page.goto("/dashboard");
    await page.keyboard.press("/");
    await page.getByRole("option", { name: /Tokyo/ }).click();
    await expect(page).toHaveURL(/\/place\/1850147-tokyo$/);

    await page.keyboard.press("/");
    await page.getByRole("option", { name: "Alerts" }).click();
    await expect(page).toHaveURL(/\/alerts$/);
  });

  test("there is only one search dialog, however many triggers the page has", async ({ page }) => {
    await page.goto("/dashboard");
    await page.keyboard.press("/");
    await expect(page.getByRole("dialog")).toHaveCount(1);
  });

  test("the sidebar collapses to an icon rail, stays usable, and remembers it", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedPlaces(context, baseURL!);
    await page.goto("/dashboard");
    const sidebar = page.locator('[data-slot="sidebar"]');
    await expect(sidebar).toHaveAttribute("data-state", "expanded");

    await page.getByRole("button", { name: "Toggle Sidebar" }).first().click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    // Labels are clipped to the icons, but every destination and place is still a link.
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveCount(4);
    await expect(
      page.getByRole("navigation", { name: "Your Places" }).getByRole("link"),
    ).toHaveCount(2);

    await page.reload();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");

    await page.keyboard.press("ControlOrMeta+b");
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  });

  test("the sidebar shows the default home place when nothing is saved", async ({ page }) => {
    await page.goto("/dashboard");
    const places = page.getByRole("navigation", { name: "Your Places" });
    await expect(places.getByRole("link", { name: "Subang Jaya" })).toBeVisible();
    await expect(places.getByRole("link", { name: "Subang Jaya" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a bottom tab bar replaces the sidebar", async ({ page }) => {
    await mockMapNetwork(page);
    await page.goto("/dashboard");

    const tabs = page.getByRole("navigation", { name: "Main" });
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("navigation", { name: "Your Places" })).toBeHidden();

    // One tap to get anywhere.
    await tabs.getByRole("link", { name: "Map" }).click();
    await expect(page).toHaveURL(/\/map$/);
    await expect(tabs.getByRole("link", { name: "Map" })).toHaveAttribute("aria-current", "page");
  });

  test("the tab bar doesn't cover the end of the page or add horizontal scroll", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const tabs = page.getByRole("navigation", { name: "Main" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const content = await page.locator("main").boundingBox();
    const bar = await tabs.boundingBox();
    expect(content!.y + content!.height).toBeLessThanOrEqual(bar!.y + 1);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("preferences", () => {
  test("the toolbar sits beside search in the header", async ({ page }) => {
    await page.goto("/dashboard");
    const header = page.getByRole("banner");
    await expect(header.getByRole("button", { name: "Search Places" })).toBeVisible();
    await expect(header.getByRole("radiogroup", { name: "Units" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Theme" })).toBeVisible();
    // Nothing is left behind in the sidebar.
    await expect(page.getByRole("radiogroup", { name: "Units" })).toHaveCount(1);
  });

  test("theme is a menu of light, dark and system, and it persists", async ({ page }) => {
    await page.goto("/dashboard");
    const toggle = page.getByRole("button", { name: "Theme" });
    // The menu only shows a selection once the page has hydrated.
    await toggle.click();
    await expect(page.getByRole("menuitemradio", { name: "System" })).toBeChecked();

    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();
    await page.getByRole("button", { name: "Theme" }).click();
    await expect(page.getByRole("menuitemradio", { name: "Dark" })).toBeChecked();
  });

  test("D flips the theme from anywhere, and the command palette offers it too", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/dashboard");
    // The menu shows a selection only once the page has hydrated, so the key listener is live.
    await page.getByRole("button", { name: "Theme" }).click();
    await expect(page.getByRole("menuitemradio", { name: "System" })).toBeChecked();
    await page.keyboard.press("Escape");

    await page.keyboard.press("d");
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.keyboard.press("/");
    await page.getByRole("option", { name: /Switch to Light Theme/ }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Typing the letter in the search box must not flip anything.
    await page.keyboard.press("/");
    await page.getByPlaceholder("Search a city…").pressSequentially("dd");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("the menu drawer lists your places and closes once you pick one", async ({
      page,
      context,
      baseURL,
    }) => {
      await seedPlaces(context, baseURL!);
      await page.goto("/dashboard");
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();
      const places = page.getByRole("navigation", { name: "Your Places" });
      await expect(places).toBeVisible();

      await places.getByRole("link", { name: /Tokyo/ }).click();
      await expect(page).toHaveURL(/\/place\/1850147-tokyo$/);
      await expect(places).toBeHidden();
    });

    test("the toolbar still fits the header without horizontal scroll", async ({ page }) => {
      await page.goto("/dashboard");
      const header = page.getByRole("banner");
      await expect(header.getByRole("radiogroup", { name: "Units" })).toBeVisible();
      await expect(header.getByRole("button", { name: "Theme" })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
});
