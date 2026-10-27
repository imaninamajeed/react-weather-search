import { expect, test } from "@playwright/test";

test.describe("alerts", () => {
  test("official warnings lead, forecast signals follow, and sources are named", async ({
    page,
  }) => {
    await page.goto("/place/8504423-subang-jaya");
    const alerts = page.getByRole("region", { name: "Alerts" });

    await expect(alerts.getByText("Thunderstorms Warning")).toBeVisible();
    await expect(alerts.getByText(/Official · MET Malaysia/)).toBeVisible();
    await expect(alerts.getByText("Forecast signal").first()).toBeVisible();
    await expect(alerts.getByText("Checked: Forecast signals, MET Malaysia.")).toBeVisible();

    await alerts.getByText("Full notice").click();
    await expect(alerts.getByText(/expected over the states of Selangor/)).toBeVisible();
  });

  test("the dashboard gathers alerts across places", async ({ page }) => {
    await page.goto("/");
    const alerts = page.getByRole("region", { name: "Alerts" });
    await expect(alerts.getByRole("link", { name: "Subang Jaya" })).toBeVisible();
    await expect(alerts.getByText("Thunderstorms Warning")).toBeVisible();
  });

  test("places with no matching warning say so", async ({ page }) => {
    await page.goto("/place/1850147-tokyo");
    const alerts = page.getByRole("region", { name: "Alerts" });
    // Tokyo reuses the same mocked forecast, so it has the forecast signal but no official feed.
    await expect(alerts.getByText(/Official/)).toHaveCount(0);
    await expect(alerts.getByText("Checked: Forecast signals.")).toBeVisible();
  });
});

test.describe("outlook", () => {
  test("the forecast page teases three days and links to the full outlook", async ({ page }) => {
    await page.goto("/place/8504423-subang-jaya");
    const teaser = page.getByRole("region", { name: "Next 3 days" });
    await expect(teaser.getByRole("listitem")).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "14-day outlook" })).toHaveCount(0);

    await teaser.getByRole("link", { name: /14-day outlook and confidence/ }).click();
    await expect(page).toHaveURL(/\/place\/8504423-subang-jaya\/outlook$/);
    await expect(page.getByRole("link", { name: "Outlook", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("rates each day inline and explains how far to trust the week", async ({ page }) => {
    await page.goto("/place/8504423-subang-jaya/outlook");
    const daily = page.getByRole("region", { name: "14-day outlook" });
    // 14 days listed; the models cover the first 7, each rated high, medium or low.
    await expect(daily.getByText("Days 8–14: indicative only", { exact: false })).toBeVisible();
    await expect(daily.getByText(/(High|Medium|Low) confidence/)).toHaveCount(7);

    const section = page.getByRole("region", { name: "Forecast confidence" });
    await expect(section.getByText(/GFS expects .* of rain/)).toBeVisible();
    await section.getByRole("radio", { name: "Rainfall" }).click();
    await section.getByText("View as table").click();
    await expect(section.getByRole("row")).toHaveCount(8); // header + 7 days
  });

  test("moves between a place's three views", async ({ page }) => {
    await page.goto("/place/8504423-subang-jaya");
    await expect(page.getByRole("link", { name: "Forecast" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.getByRole("link", { name: "Outlook", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Subang Jaya" })).toBeVisible();
    await page.getByRole("link", { name: "Climate" }).click();
    await expect(page).toHaveURL(/\/history$/);
    await expect(page.getByRole("link", { name: "Climate" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.getByRole("link", { name: "Forecast" }).click();
    await expect(page).toHaveURL(/\/place\/8504423-subang-jaya$/);
  });
});

test("the 48-hour chart switches metric and has a table twin", async ({ page }) => {
  await page.goto("/place/8504423-subang-jaya");
  const section = page.getByRole("region", { name: "Next 48 hours" });
  for (const metric of ["Rain", "Wind", "Temperature"]) {
    await section.getByRole("radio", { name: metric }).click();
    await expect(section.getByRole("radio", { name: metric })).toBeChecked();
  }
  await section.getByText("View as table").click();
  await expect(section.getByRole("table").getByRole("row")).toHaveCount(49);
});

test("climate history compares the year with normals", async ({ page }) => {
  await page.goto("/place/8504423-subang-jaya/history");
  await expect(page.getByRole("heading", { level: 1, name: "Subang Jaya" })).toBeVisible();
  const glance = page.getByRole("region", { name: "The year at a glance" });
  await expect(glance.getByText("Rainfall")).toBeVisible();
  await expect(glance.getByText("Warmest day")).toBeVisible();
  await expect(page.getByRole("region", { name: "Daily highs" })).toBeVisible();

  await page.getByText("Monthly rainfall as a table").click();
  await expect(
    page.getByRole("table", { name: "Monthly rainfall against normal" }).getByRole("row"),
  ).toHaveCount(13);

  // Navigation between the two views of a place.
  await page.getByRole("link", { name: "Forecast" }).click();
  await expect(page).toHaveURL(/\/place\/8504423-subang-jaya$/);
});

test("current conditions come before the charts on the forecast page", async ({ page }) => {
  await page.goto("/place/8504423-subang-jaya");
  const top = async (name: string) =>
    (await page.getByRole("heading", { level: 2, name }).boundingBox())!.y;
  expect(await top("Right now")).toBeLessThan(await top("Next 48 hours"));
});
