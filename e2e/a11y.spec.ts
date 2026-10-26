import { test } from "@playwright/test";
import { expectNoSeriousViolations, mockMapNetwork } from "./helpers";

test.use({
  launchOptions: {
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  },
});

const PAGES = [
  ["dashboard", "/"],
  ["place", "/place/8504423-subang-jaya"],
  ["history", "/place/8504423-subang-jaya/history"],
  ["map", "/map"],
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
  await page.goto("/");
  await page.keyboard.press("/");
  await page.getByPlaceholder("Search a city…").fill("tok");
  await page.getByRole("option").first().waitFor();
  await expectNoSeriousViolations(page);
});
