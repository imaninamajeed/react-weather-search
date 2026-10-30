import { expect, test } from "@playwright/test";
import { expectNoSeriousViolations, seedPlaces } from "./helpers";

// Wide and tall enough for the `fit` variant (see globals.css): the page is one screen, not a scroll.
const SIZES = [
  { width: 1366, height: 800 },
  { width: 1920, height: 1080 },
];

const PAGES = [
  ["dashboard", "/"],
  ["forecast", "/place/8504423-subang-jaya"],
] as const;

for (const size of SIZES) {
  for (const [name, path] of PAGES) {
    test.describe(`${name} at ${size.width}×${size.height}`, () => {
      test.use({ viewport: size });

      test("fits the viewport without scrolling the page", async ({ page, context, baseURL }) => {
        await seedPlaces(context, baseURL!);
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const { doc, win } = await page.evaluate(() => ({
          doc: document.documentElement.scrollHeight,
          win: window.innerHeight,
        }));
        expect(doc).toBeLessThanOrEqual(win);
      });

      test("has no serious accessibility violations", async ({ page, context, baseURL }) => {
        await seedPlaces(context, baseURL!);
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expectNoSeriousViolations(page);
      });
    });
  }
}

test("short windows keep the scrolling layout", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/place/8504423-subang-jaya");
  await page.waitForLoadState("networkidle");
  const { doc, win } = await page.evaluate(() => ({
    doc: document.documentElement.scrollHeight,
    win: window.innerHeight,
  }));
  expect(doc).toBeGreaterThan(win);
});
