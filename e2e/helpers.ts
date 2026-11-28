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

/** One run of visible text: where it is, its colour (RGBA) and how big it is drawn. */
interface TextSample {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number[];
  size: number;
  weight: number;
}

/**
 * WCAG contrast measured from pixels, for text on art (skies, gradients) where axe can only report
 * "incomplete". Records every visible text run inside `selector`, hides the text and the icons,
 * photographs the bare background, and returns each run whose worst pixel falls under 4.5:1 (3:1
 * for large text). Semi-transparent text is blended with each pixel before it is compared.
 */
export async function measureTextContrast(page: Page, selector: string) {
  const root = page.locator(selector).first();
  await root.scrollIntoViewIfNeeded();
  const texts = await root.evaluate((element) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const rgba = (c: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data);
    };
    const bounds = element.getBoundingClientRect();
    const out: TextSample[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent!.trim();
      const el = node.parentElement!;
      if (
        !text ||
        el.closest(".sr-only") ||
        (el.closest("[aria-hidden=true]") && !el.closest("span[aria-hidden=true]"))
      )
        continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Clipped by the panel (a strip scrolled past its edge): not visible, so not measured.
      if (r.left < bounds.left || r.right > bounds.right || r.bottom > bounds.bottom) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
      out.push({
        text: text.slice(0, 32),
        x: r.x - bounds.x,
        y: r.y - bounds.y,
        w: r.width,
        h: r.height,
        color: rgba(cs.color),
        size: parseFloat(cs.fontSize),
        weight: parseInt(cs.fontWeight),
      });
    }
    return out;
  });

  // Fixed and sticky chrome (the phone's tab bar, the header) would be photographed over the panel.
  await root.evaluate((element) => {
    for (const el of document.querySelectorAll("body *")) {
      const { position } = getComputedStyle(el);
      if ((position === "fixed" || position === "sticky") && !element.contains(el)) {
        el.setAttribute("data-contrast-hide", "");
      }
    }
  });
  const hide = await page.addStyleTag({
    content: `${selector} * { color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }
      ${selector} svg:not([data-sky-art] svg) { visibility: hidden !important; }
      [data-contrast-hide] { visibility: hidden !important; }`,
  });
  const png = await root.screenshot({ animations: "disabled" });
  await hide.evaluate((n) => (n as HTMLElement).remove());
  await page.evaluate(() =>
    document.querySelectorAll("[data-contrast-hide]").forEach((el) => {
      el.removeAttribute("data-contrast-hide");
    }),
  );
  const width = (await root.boundingBox())!.width;

  const report = await page.evaluate(
    async ({ b64, texts, width }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      // The screenshot is in device pixels; the text boxes are in CSS pixels.
      const scale = img.width / width;
      const channel = (v: number) => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      const lum = (r: number, g: number, b: number) =>
        0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      return texts.map((t) => {
        const x = Math.max(0, Math.floor(t.x * scale));
        const y = Math.max(0, Math.floor(t.y * scale));
        const w = Math.max(1, Math.min(img.width - x, Math.ceil(t.w * scale)));
        const h = Math.max(1, Math.min(img.height - y, Math.ceil(t.h * scale)));
        const data = ctx.getImageData(x, y, w, h).data;
        const [tr, tg, tb, ta] = t.color;
        const alpha = ta / 255;
        let worst = 99;
        for (let i = 0; i < data.length; i += 4 * 2) {
          const [br, bg, bb] = [data[i], data[i + 1], data[i + 2]];
          const fg = lum(
            tr * alpha + br * (1 - alpha),
            tg * alpha + bg * (1 - alpha),
            tb * alpha + bb * (1 - alpha),
          );
          worst = Math.min(worst, ratio(fg, lum(br, bg, bb)));
        }
        const large = t.size >= 24 || (t.size >= 18.66 && t.weight >= 700);
        return { text: t.text, worst: +worst.toFixed(2), need: large ? 3 : 4.5 };
      });
    },
    { b64: png.toString("base64"), texts, width },
  );
  return {
    measured: report.length,
    failures: report
      .filter((r) => r.worst < r.need)
      .map((r) => `"${r.text}" ${r.worst} < ${r.need}`),
    tightest: Math.min(...report.map((r) => r.worst / r.need)),
  };
}
