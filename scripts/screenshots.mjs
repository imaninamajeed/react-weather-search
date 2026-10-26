// Regenerates the PWA install screenshots from a running production server:
//   pnpm build && pnpm start   (in one terminal)
//   node scripts/screenshots.mjs [baseUrl]   (in another)
// Uses a seeded cookie so the dashboard shows saved places. Output is live data, so it is a
// snapshot in time, which is exactly what an app-store style screenshot is.
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const place = (key, name, region, country, countryCode, latitude, longitude, timezone) => ({
  key, name, region, country, countryCode, latitude, longitude, timezone,
});
const preferences = {
  units: "metric",
  homeKey: "8504423-subang-jaya",
  places: [
    place("8504423-subang-jaya", "Subang Jaya", "Selangor", "Malaysia", "MY", 3.04384, 101.58062, "Asia/Kuala_Lumpur"),
    place("1735339-mukah", "Mukah", "Sarawak", "Malaysia", "MY", 2.89, 112.09, "Asia/Kuching"),
    place("1850147-tokyo", "Tokyo", "Tokyo", "Japan", "JP", 35.6895, 139.69171, "Asia/Tokyo"),
  ],
};

const browser = await chromium.launch();
for (const [file, width, height] of [
  ["dashboard-narrow", 390, 844],
  ["dashboard-wide", 1280, 720],
]) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: "dark" });
  await context.addCookies([{ name: "wx", value: JSON.stringify(preferences), url: base }]);
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `public/screenshots/${file}.jpg`, type: "jpeg", quality: 85 });
  console.log("wrote", file);
  await context.close();
}
await browser.close();
