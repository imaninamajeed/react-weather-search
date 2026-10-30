import { test } from "@playwright/test";
import { seedPlaces } from "./helpers";

for (const scheme of ["light", "dark"] as const) {
  for (const width of [1280, 390]) {
    test(`hero contrast ${scheme} ${width}`, async ({ page, context, baseURL }) => {
      await seedPlaces(context, baseURL!);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
      const hero = page.locator("header#place-title, header:has(#place-title)").first();
      await hero.scrollIntoViewIfNeeded();
      const results: string[] = [];
      for (const turn of [0, 90, 180, 270]) {
        await page.addStyleTag({
          content: `header:has(#place-title) > svg { rotate: ${turn}deg !important; animation: none !important; }`,
        });
        // Collect text boxes + colours, then hide the text to photograph the bare background.
        const texts = await hero.evaluate((root) => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
          const rgba = (c: string) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = c;
            ctx.fillRect(0, 0, 1, 1);
            return Array.from(ctx.getImageData(0, 0, 1, 1).data);
          };
          const out: any[] = [];
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          let node: Node | null;
          while ((node = walker.nextNode())) {
            const text = node.textContent!.trim();
            const el = node.parentElement!;
            if (!text || el.closest(".sr-only") || el.closest("[aria-hidden=true]") && !el.closest("span[aria-hidden=true]")) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            const r = range.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (r.width === 0) continue;
            const hb = root.getBoundingClientRect();
            if (r.left < hb.left || r.right > hb.right) continue;
            out.push({
              text: text.slice(0, 24),
              x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height,
              color: rgba(cs.color),
              size: parseFloat(cs.fontSize),
              weight: parseInt(cs.fontWeight),
            });
          }
          return out;
        });
        const style = await page.addStyleTag({
          content: `header:has(#place-title) * { color: transparent !important; text-shadow: none !important; } header:has(#place-title) svg:not(:first-of-type) { visibility: hidden }`,
        });
        const box = (await hero.boundingBox())!;
        const png = await page.screenshot({ fullPage: true, clip: { x: box.x + 0, y: box.y + (await page.evaluate(() => scrollY)), width: box.width, height: box.height } });
        await style.evaluate((n) => (n as HTMLElement).remove());
        const report = await page.evaluate(
          async ({ b64, texts, ox, oy }) => {
            const img = new Image();
            img.src = "data:image/png;base64," + b64;
            await img.decode();
            const c = document.createElement("canvas");
            c.width = img.width; c.height = img.height;
            const ctx = c.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(img, 0, 0);
            const lum = (r: number, g: number, b: number) => {
              const f = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
              return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
            };
            const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            return texts.map((t: any) => {
              const x = Math.max(0, Math.floor(t.x - ox)), y = Math.max(0, Math.floor(t.y - oy));
              const w = Math.max(1, Math.min(img.width - x, Math.ceil(t.w))), h = Math.max(1, Math.min(img.height - y, Math.ceil(t.h)));
              const d = ctx.getImageData(x, y, w, h).data;
              let worst = 99;
              const tl = lum(t.color[0], t.color[1], t.color[2]);
              for (let i = 0; i < d.length; i += 4 * 3) {
                worst = Math.min(worst, ratio(tl, lum(d[i], d[i + 1], d[i + 2])));
              }
              const large = t.size >= 24 || (t.size >= 18.66 && t.weight >= 700);
              return { text: t.text, worst: +worst.toFixed(2), need: large ? 3 : 4.5, color: t.color.join(','), size: t.size };
            });
          },
          { b64: png.toString("base64"), texts, ox: box.x + 0, oy: box.y + (await page.evaluate(() => scrollY)) },
        );
        for (const r of report) if (r.worst < r.need) results.push(`"${r.text}" ${r.worst} < ${r.need} rgba=${r.color} size=${r.size}`);
        const min = Math.min(...report.map((r: any) => r.worst / r.need));
        results.push(`turn ${turn}: ${report.length} texts, tightest ratio/need = ${min.toFixed(2)}`);
      }
      console.log(`\n== ${scheme} ${width} ==\n` + [...new Set(results)].join("\n"));
    });
  }
}
