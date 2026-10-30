import { test } from "@playwright/test";
import { expectNoSeriousViolations, mockMapNetwork, seedPlaces } from "./helpers";

// The map needs WebGL, which headless Chromium only has through a software renderer.
test.use({
  launchOptions: {
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  },
});

// Wide and tall enough for the `fit` variant (see globals.css), where the denser layouts apply.
const SIZES = [
  { width: 1366, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const PAGES = [
  ["forecast", "/place/8504423-subang-jaya"],
  ["outlook", "/place/8504423-subang-jaya/outlook"],
  ["climate", "/place/8504423-subang-jaya/history"],
  ["alerts", "/alerts"],
  ["places", "/places"],
  ["map", "/map"],
  ["about", "/about"],
  ["offline", "/offline"],
  ["not found", "/place/nope"],
] as const;

async function open(
  page: import("@playwright/test").Page,
  context: import("@playwright/test").BrowserContext,
  baseURL: string,
  path: string,
  scheme: "light" | "dark",
) {
  await seedPlaces(context, baseURL);
  await mockMapNetwork(page);
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

for (const scheme of ["light", "dark"] as const) {
  for (const [name, path] of PAGES) {
    test(`${name} has no serious accessibility violations at 1366×800 (${scheme})`, async ({
      page,
      context,
      baseURL,
    }) => {
      await page.setViewportSize(SIZES[0]);
      await open(page, context, baseURL!, path, scheme);
      await expectNoSeriousViolations(page);
    });
  }
}
