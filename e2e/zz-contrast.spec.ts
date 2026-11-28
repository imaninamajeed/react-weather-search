import { expect, test } from "@playwright/test";
import { measureTextContrast, seedPlaces } from "./helpers";

/*
 * The dashboard hero's text sits straight on its sky, where axe can only say "incomplete", so its
 * contrast is measured from pixels (see measureTextContrast). e2e/sky.spec.ts does the same for every
 * palette on the place page; this covers the dashboard's own layout with the fixture's weather.
 */
for (const scheme of ["light", "dark"] as const) {
  for (const width of [1280, 390]) {
    test(`dashboard hero contrast ${scheme} ${width}`, async ({ page, context, baseURL }) => {
      await seedPlaces(context, baseURL!);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto("/dashboard");
      const { measured, failures } = await measureTextContrast(page, "header:has(#place-title)");
      expect(measured).toBeGreaterThan(10);
      expect(failures, failures.join("\n")).toEqual([]);
    });
  }
}
