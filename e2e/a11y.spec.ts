import { test } from "@playwright/test";
import { expectNoSeriousViolations, mockMapNetwork, seedPlaces } from "./helpers";

test.use({
  launchOptions: {
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  },
});

const PAGES = [
  ["dashboard", "/dashboard"],
  ["place", "/place/8504423-subang-jaya"],
  ["outlook", "/place/8504423-subang-jaya/outlook"],
  ["history", "/place/8504423-subang-jaya/history"],
  ["alerts", "/alerts"],
  ["places", "/places"],
  ["map", "/map"],
  ["about", "/about"],
  ["welcome", "/"],
  ["offline", "/offline"],
  ["not found", "/place/nope"],
] as const;

for (const scheme of ["light", "dark"] as const) {
  for (const [name, path] of PAGES) {
    test(`${name} has no serious accessibility violations (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await mockMapNetwork(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoSeriousViolations(page);
    });
  }
}

test("the search dialog is accessible", async ({ page }) => {
  await page.goto("/dashboard");
  await page.keyboard.press("/");
  await page.getByPlaceholder("Search a city…").fill("tok");
  await page.getByRole("option").first().waitFor();
  await expectNoSeriousViolations(page);
});

for (const scheme of ["light", "dark"] as const) {
  test(`places with saved places and the week-ahead table are accessible (${scheme})`, async ({
    page,
    context,
    baseURL,
  }) => {
    await seedPlaces(context, baseURL!);
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/places");
    await page.getByRole("tab", { name: /Saved Locations/ }).waitFor();
    await page.waitForLoadState("networkidle");
    await expectNoSeriousViolations(page);
  });
}
