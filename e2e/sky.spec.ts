import { expect, test } from "@playwright/test";
import { measureTextContrast } from "./helpers";
import { SKY_LATITUDE, SKY_SCENES } from "./sky-scenes.mjs";

/*
 * Every sky a hero can show, in both themes, at a phone, a two-column laptop and the dense `fit`
 * layout: the palette must be the one the weather asks for, and every word on it must keep WCAG
 * contrast against the pixels behind it (axe can't judge text on a gradient, so this measures).
 * The upstream mock answers /place/7.77,N with scene N (e2e/sky-scenes.mjs).
 */
const SIZES = [
  { width: 390, height: 844 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

for (const scheme of ["light", "dark"] as const) {
  for (const [index, scene] of SKY_SCENES.entries()) {
    test(`${scene.palette} sky reads in ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      const failures: string[] = [];
      for (const size of SIZES) {
        await page.setViewportSize(size);
        await page.goto(`/place/${SKY_LATITUDE},${index + 1}`);
        const hero = "header:has(#place-title)";
        await expect(page.locator(hero)).toHaveAttribute("data-sky", scene.palette);
        const result = await measureTextContrast(page, hero);
        expect(result.measured, "the hero has text to measure").toBeGreaterThan(10);
        failures.push(...result.failures.map((failure) => `${size.width}px ${failure}`));
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });
  }

  test(`page banners read in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    for (const path of ["/alerts", "/places", "/map"]) {
      for (const size of [SIZES[0], SIZES[2]]) {
        await page.setViewportSize(size);
        await page.goto(path);
        const banner = "main section[data-sky]";
        await expect(page.locator(banner).first()).toBeVisible();
        const { failures } = await measureTextContrast(page, banner);
        expect(failures, `${path} ${size.width}px:\n${failures.join("\n")}`).toEqual([]);
      }
    }
  });
}
