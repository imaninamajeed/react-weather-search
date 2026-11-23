// Renders design/og-image.html to src/app/opengraph-image.jpg, the image link previews and the
// README banner use. Needs network access for the brand fonts (Google Fonts).
//   node scripts/og-image.mjs
// JPEG at 1200x630 keeps it small enough for chat apps that skip large previews; a PNG of the
// same image is several times the size because of the radar and glow.
import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const source = pathToFileURL(resolve("design/og-image.html")).href;
const out = "src/app/opengraph-image.jpg";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(source, { waitUntil: "networkidle" });
await page.waitForSelector("body[data-ready]");
await page.screenshot({ path: out, type: "jpeg", quality: 90 });
console.log("wrote", out);
await browser.close();
