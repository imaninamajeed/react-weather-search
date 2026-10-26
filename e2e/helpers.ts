import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** 1×1 transparent PNG, for radar tiles. */
const BLANK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

/**
 * The map's basemap and radar tiles load in the *browser*, so they are mocked here (the server's
 * upstream calls are mocked by e2e/mock-upstream.mjs). The style is an empty background.
 */
export async function mockMapNetwork(page: Page) {
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({
      json: {
        version: 8,
        sources: {},
        layers: [
          { id: "background", type: "background", paint: { "background-color": "#cdd5d8" } },
        ],
      },
    }),
  );
  await page.route("https://tilecache.rainviewer.com/**", (route) =>
    route.fulfill({ body: BLANK_PNG, contentType: "image/png" }),
  );
}

/** Fails on any serious or critical WCAG A/AA violation, printing what and where. */
export async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  const summary = serious.map(
    (v) =>
      `${v.impact}: ${v.id} (${v.help})\n  ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join("\n  ")}`,
  );
  expect(summary, summary.join("\n")).toEqual([]);
}
