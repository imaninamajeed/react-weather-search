import { expect, test } from "@playwright/test";

test("the manifest is valid and its assets exist", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({
    short_name: "Isobar",
    display: "standalone",
    start_url: "/",
    scope: "/",
  });
  expect(manifest.icons.some((icon: { purpose: string }) => icon.purpose === "maskable")).toBe(
    true,
  );
  for (const { src } of [
    ...manifest.icons,
    ...manifest.screenshots,
    ...manifest.shortcuts.flatMap((s: { icons: object[] }) => s.icons),
  ]) {
    expect((await request.get(src)).status(), src).toBe(200);
  }
});

test("the service worker is served uncacheable with the right scope", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-cache");
  expect(response.headers()["service-worker-allowed"]).toBe("/");
});

test("visited pages work offline, unvisited ones fall back, and actions are disabled", async ({
  page,
  context,
}) => {
  await page.goto("/place/1850147-tokyo");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now controlled by the worker, so this page is cached
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.goto("/place/1850147-tokyo");
  await page.waitForLoadState("networkidle");

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Tokyo" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "You're offline" })).toBeVisible();
  const save = page.getByRole("button", { name: "Save", exact: true });
  await expect(save).toBeDisabled();
  await expect(save).toHaveAttribute("title", "Needs a connection");

  await page.goto("/place/2643743-london").catch(() => undefined);
  await expect(page.getByRole("heading", { level: 1, name: "You're offline" })).toBeVisible();

  await context.setOffline(false);
  await page.goto("/place/1850147-tokyo");
  await expect(page.getByRole("status").filter({ hasText: "You're offline" })).toHaveCount(0);
});
