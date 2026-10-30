import { expect, test } from "@playwright/test";
import { THRESHOLDS } from "../src/lib/alerts/hazards";
import { CONFIDENCE_THRESHOLDS } from "../src/lib/weather/confidence";

test("the about page documents sources, thresholds and limits", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: "Data and methods" })).toBeVisible();
  for (const section of [
    "Data sources",
    "How alerts work",
    "How forecast confidence works",
    "How climate history works",
    "Privacy",
    "What it can't tell you",
  ]) {
    await expect(page.getByRole("heading", { level: 2, name: section })).toBeVisible();
  }

  const sources = page.getByRole("table", { name: "Data sources" });
  for (const name of ["Open-Meteo", "MET Malaysia", "US National Weather Service", "RainViewer"]) {
    await expect(sources.getByRole("link", { name })).toBeVisible();
  }
});

test("the numbers on the about page come from the thresholds the app uses", async ({ page }) => {
  await page.goto("/about");
  const hazards = page.getByRole("table", { name: "Forecast signal thresholds" });
  await expect(hazards.getByRole("row", { name: /Strong gusts/ })).toContainText(
    `≥ ${THRESHOLDS.gusts.advisory} km/h`,
  );
  await expect(hazards.getByRole("row", { name: /Strong gusts/ })).toContainText(
    `≥ ${THRESHOLDS.gusts.warning} km/h`,
  );
  await expect(hazards.getByRole("row", { name: /Air quality/ })).toContainText(
    `US AQI ≥ ${THRESHOLDS.aqi.warning}`,
  );
  await expect(page.getByText(`Within ${CONFIDENCE_THRESHOLDS.highMaxSpread} °C`)).toBeVisible();
});

test("methods are one click from where they matter", async ({ page }) => {
  await page.goto("/place/8504423-subang-jaya/outlook");
  await page.getByText("How is this calculated?").click();
  await page.getByRole("link", { name: "More on our methods" }).click();
  await expect(page).toHaveURL(/\/about#confidence$/);

  await page.goto("/alerts");
  await page.getByRole("link", { name: "How alerts work" }).click();
  await expect(page).toHaveURL(/\/about#alerts$/);
});

test("the sidebar links to the about page", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("link", { name: "About", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("on a phone, About is in the drawer, and the page has breadcrumbs", async ({ page }) => {
  // Breadcrumbs belong to the phone layout; from md up the sidebar replaces them.
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  const crumbs = page.getByRole("navigation", { name: "breadcrumb" });
  await expect(crumbs.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(crumbs.getByText("About")).toBeVisible();
});
