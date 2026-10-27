import { expect, test } from "@playwright/test";
import { mockMapNetwork } from "./helpers";

test.use({
  launchOptions: {
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  },
});

test("the map shows the home place and radar controls", async ({ page }) => {
  await mockMapNetwork(page);
  await page.goto("/map");

  await expect(page.getByRole("heading", { level: 1, name: "Map" })).toBeVisible();
  await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
  // The default home place is a focusable link on the map.
  await expect(page.locator(".maplibregl-marker").getByText("Subang Jaya")).toBeVisible();

  const scrubber = page.getByRole("slider", { name: "Radar time" });
  await expect(scrubber).toHaveAttribute("aria-valuetext", "Latest frame");
  await scrubber.focus();
  await page.keyboard.press("Home");
  await expect(scrubber).toHaveAttribute("aria-valuetext", "120 minutes before the latest frame");

  const play = page.getByRole("button", { name: "Play radar animation" });
  await play.click();
  await expect(page.getByRole("button", { name: "Pause radar animation" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Pause radar animation" }).click();

  await expect(page.getByRole("slider", { name: "Radar opacity" })).toBeVisible();
});

test("clicking the map shows the weather at that spot", async ({ page }) => {
  await mockMapNetwork(page);
  await page.goto("/map");
  const canvas = page.locator("canvas.maplibregl-canvas");
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.2);

  const popup = page.locator(".maplibregl-popup");
  await expect(popup.getByText("Open forecast →")).toBeVisible();
  await expect(popup.getByText(/Rain \d+%/)).toBeVisible();
});

test("opens centred on a place from its forecast page", async ({ page }) => {
  await mockMapNetwork(page);
  await page.goto("/place/1850147-tokyo");
  await page.getByRole("link", { name: "Radar for Tokyo" }).click();

  await expect(page).toHaveURL(/\/map\?place=1850147-tokyo$/);
  // Tokyo isn't saved, but the focused place is still shown (and visible, i.e. in view).
  await expect(page.locator(".maplibregl-marker").getByText("Tokyo")).toBeVisible();
});
