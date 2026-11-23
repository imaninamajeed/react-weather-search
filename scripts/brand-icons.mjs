// Renders the Isobar mark (src/components/shared/isobar-mark.tsx) to every static icon, so the
// favicon, home-screen and install icons always match the sidebar:
//   node scripts/brand-icons.mjs
// The component is bundled with React and rendered to SVG markup, then rasterised in Chromium.
// Each output uses the optical size meant for it: the tab gets the two-ring mark, the install
// icons the full one.
import { chromium } from "@playwright/test";
import { build } from "esbuild";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bundled = await build({
  stdin: {
    contents: `
      import { createElement } from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { IsobarMark } from "@/components/shared/isobar-mark";
      export const render = (props) =>
        renderToStaticMarkup(createElement(IsobarMark, { "aria-hidden": undefined, ...props }));
    `,
    resolveDir: process.cwd(),
    loader: "tsx",
  },
  bundle: true,
  write: false,
  format: "cjs",
  platform: "node",
  jsx: "automatic",
  logLevel: "warning",
  define: { "process.env.NODE_ENV": '"production"' },
});
const dir = mkdtempSync(join(tmpdir(), "isobar-mark-"));
const entry = join(dir, "mark.cjs");
writeFileSync(entry, bundled.outputFiles[0].text);
const { render } = createRequire(import.meta.url)(entry);
rmSync(dir, { recursive: true });

const svg = (props) => `${render(props)}\n`;

// Vector files: the tab icon (Next.js links it with sizes="any") and the master for design work.
writeFileSync("src/app/icon.svg", svg({ detail: "small" }));
writeFileSync("design/isobar-mark.svg", svg({ detail: "full" }));
console.log("wrote src/app/icon.svg, design/isobar-mark.svg");

const browser = await chromium.launch();
const page = await browser.newPage();
async function png(props, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${render(props)}`,
  );
  return page.screenshot({ type: "png", omitBackground: true });
}

const rasters = [
  // iOS masks the corners itself and shows transparency as black, so this one is full-bleed.
  ["src/app/apple-icon.png", { detail: "full", square: true }, 180],
  ["public/icons/icon-192.png", { detail: "full" }, 192],
  ["public/icons/icon-512.png", { detail: "full" }, 512],
  // Launchers crop maskable icons to their own shape; the core and inner rings sit well inside
  // the 80% safe zone, and the outer rings are meant to run off the edge.
  ["public/icons/maskable-512.png", { detail: "full", square: true }, 512],
];
for (const [file, props, size] of rasters) {
  writeFileSync(file, await png(props, size));
  console.log("wrote", file);
}

// favicon.ico for browsers without SVG favicons: PNG entries at 16 and 32 (tab) and 48 (Windows).
const entries = [
  [16, await png({ detail: "small" }, 16)],
  [32, await png({ detail: "small" }, 32)],
  [48, await png({ detail: "compact" }, 48)],
];
await browser.close();

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(entries.length, 4);
let offset = header.length + entries.length * 16;
const directory = entries.map(([size, data]) => {
  const record = Buffer.alloc(16);
  record.writeUInt8(size, 0);
  record.writeUInt8(size, 1);
  record.writeUInt16LE(1, 4);
  record.writeUInt16LE(32, 6);
  record.writeUInt32LE(data.length, 8);
  record.writeUInt32LE(offset, 12);
  offset += data.length;
  return record;
});
writeFileSync(
  "src/app/favicon.ico",
  Buffer.concat([header, ...directory, ...entries.map(([, data]) => data)]),
);
console.log("wrote src/app/favicon.ico");
