import AxeBuilder from "@axe-core/playwright";
import { expect, type BrowserContext, type Page } from "@playwright/test";

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
  // A card that scrolls inside a one-screen page becomes keyboard-reachable once the page has
  // hydrated and measured it. The network can be idle before that (a busy runner hydrates late), so
  // wait for every overflowing card to be reachable. If one never is, scan anyway and let axe say so.
  await page
    .waitForFunction(() =>
      [...document.querySelectorAll('[data-slot="card-content"]')].every(
        (card) =>
          card.scrollHeight <= card.clientHeight + 1 ||
          card.hasAttribute("tabindex") ||
          card.querySelector("a[href], button, summary, input, select, textarea, [tabindex]"),
      ),
    )
    .catch(() => undefined);
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

const savedPlace = (
  key: string,
  name: string,
  latitude: number,
  longitude: number,
  extra: object = {},
) => ({ key, name, latitude, longitude, ...extra });

/** Starts a test with Subang Jaya (home) and Tokyo already saved, without clicking through the UI. */
export async function seedPlaces(context: BrowserContext, baseURL: string) {
  const preferences = {
    units: "metric",
    homeKey: "8504423-subang-jaya",
    places: [
      // Full place data, as the app itself saves it: official-warning matching needs country and region.
      savedPlace("8504423-subang-jaya", "Subang Jaya", 3.04384, 101.58062, {
        region: "Selangor",
        district: "Petaling",
        country: "Malaysia",
        countryCode: "MY",
        timezone: "Asia/Kuala_Lumpur",
      }),
      savedPlace("1850147-tokyo", "Tokyo", 35.6895, 139.69171),
    ],
  };
  await context.addCookies([{ name: "wx", value: JSON.stringify(preferences), url: baseURL }]);
}
