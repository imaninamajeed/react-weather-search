// Renders design/og-image.html to src/app/opengraph-image.png, the image link previews and the
// README banner use. Needs network access for the brand fonts (Google Fonts).
//   node scripts/og-image.mjs
import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const source = pathToFileURL(resolve("design/og-image.html")).href;
const out = "src/app/opengraph-image.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.goto(source, { waitUntil: "networkidle" });
await page.waitForSelector("body[data-ready]");
await page.screenshot({ path: out });
console.log("wrote", out);
await browser.close();
