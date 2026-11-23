import { expect, test } from "@playwright/test";
import { seedPlaces } from "./helpers";

test.describe("alerts", () => {
  test("official warnings lead, forecast signals follow, and sources are named", async ({
    page,
  }) => {
    await page.goto("/place/8504423-subang-jaya");
    const alerts = page.getByRole("region", { name: "Alerts" });

    await expect(alerts.getByText("Thunderstorms Warning")).toBeVisible();
    await expect(alerts.getByText(/Official · MET Malaysia/)).toBeVisible();
    await expect(alerts.getByText("Forecast Signal").first()).toBeVisible();
    await expect(alerts.getByText("Checked: Forecast signals, MET Malaysia.")).toBeVisible();

    await alerts.getByText("Full Notice").click();
    await expect(alerts.getByText(/expected over the states of Selangor/)).toBeVisible();
  });

  test("the dashboard summarises the most important alerts and names each place", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedPlaces(context, baseURL!);
    await page.goto("/dashboard");
    const alerts = page.getByRole("region", { name: "Alerts" });

    // Two places, three alerts in all (one official warning and two forecast signals). The banner
    // counts them all, shows the two most important as chips and says how many more there are.
    await expect(alerts.getByText("1 warning and 2 advisories")).toBeVisible();
    await expect(alerts.getByText("Thunderstorms Warning")).toBeVisible();
    // Every chip names its place and links to it; the official warning comes first.
    const chips = alerts.getByRole("link", { name: /Subang Jaya/ });
    await expect(chips).toHaveCount(2);
    await expect(chips.first()).toContainText("Thunderstorms Warning");
    await expect(chips.first()).toHaveAttribute("href", "/place/8504423-subang-jaya");
    await expect(alerts.getByText("+1 more")).toBeVisible();

    await alerts.getByRole("link", { name: /All Alerts/ }).click();
    await expect(page).toHaveURL(/\/alerts$/);
  });

  test("with more than three alerts the dashboard caps the list and links to the rest", async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      {
        name: "wx",
        value: JSON.stringify({
          units: "metric",
          homeKey: "8504423-subang-jaya",
          places: [
            {
              key: "8504423-subang-jaya",
              name: "Subang Jaya",
              region: "Selangor",
              countryCode: "MY",
              latitude: 3.04384,
              longitude: 101.58062,
            },
            { key: "1850147-tokyo", name: "Tokyo", latitude: 35.6895, longitude: 139.69171 },
            { key: "51.51,-0.13", name: "Pin", latitude: 51.51, longitude: -0.13 },
          ],
        }),
        url: baseURL!,
      },
    ]);
    await page.goto("/dashboard");
    const alerts = page.getByRole("region", { name: "Alerts" });
    await expect(alerts.getByText("Thunderstorms Warning")).toBeVisible();
    // Two are shown as chips, each a link to its place, and the official warning is first; the
    // other two are behind "All Alerts".
    const chips = alerts.getByRole("listitem").filter({ has: page.getByRole("link") });
    await expect(chips).toHaveCount(2);
    await expect(chips.first()).toContainText("Thunderstorms Warning");
    await expect(alerts.getByText("+2 more")).toBeVisible();

    await alerts.getByRole("link", { name: "All Alerts" }).click();
    await expect(page).toHaveURL(/\/alerts$/);
    await expect(page.getByRole("link", { name: "All Alerts (4)" })).toBeVisible();
  });

  test("the alerts page lists everything by place and can show official warnings only", async ({
    page,
    context,
    baseURL,
  }) => {
    await seedPlaces(context, baseURL!);
    await page.goto("/alerts");
    await expect(page.getByRole("heading", { level: 1, name: "Alerts" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Subang Jaya" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Tokyo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "All Alerts (3)" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByRole("link", { name: "Official Warnings (1)" }).click();
    await expect(page).toHaveURL(/\?show=official$/);
    // Tokyo has only a forecast signal, so it drops out; Subang Jaya keeps its official warning.
    await expect(page.getByRole("heading", { level: 2, name: "Subang Jaya" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Tokyo" })).toHaveCount(0);
    await expect(page.getByText("Thunderstorms Warning")).toBeVisible();
    await expect(page.getByText("Checked: Forecast signals, MET Malaysia.")).toBeVisible();
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
    const tabs = page.getByRole("navigation", { name: "Location Sections" });
    await expect(teaser.getByRole("listitem")).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "14-day outlook" })).toHaveCount(0);

    await teaser.getByRole("link", { name: /14-Day Outlook and Confidence/ }).click();
    await expect(page).toHaveURL(/\/place\/8504423-subang-jaya\/outlook$/);
    await expect(tabs.getByRole("link", { name: "Outlook" })).toHaveAttribute(
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
    await section.getByText("View as Table").click();
    await expect(section.getByRole("row")).toHaveCount(8); // header + 7 days
  });

  test("moves between a place's three views", async ({ page }) => {
    await page.goto("/place/8504423-subang-jaya");
    const tabs = page.getByRole("navigation", { name: "Location Sections" });
    await expect(tabs.getByRole("link", { name: "Forecast" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await tabs.getByRole("link", { name: "Outlook" }).click();
    await expect(page).toHaveURL(/\/outlook$/);
    await expect(page.getByText("Plan Ahead")).toBeVisible();
    // Let the new view finish loading before moving on; navigating mid-stream is what made this flaky.
    await page.waitForLoadState("networkidle");
    await tabs.getByRole("link", { name: "Climate" }).click();
    await expect(page).toHaveURL(/\/history$/);
    await expect(tabs.getByRole("link", { name: "Climate" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await tabs.getByRole("link", { name: "Forecast" }).click();
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
  await section.getByText("View as Table").click();
  await expect(section.getByRole("table").getByRole("row")).toHaveCount(49);
});

test("climate history compares the year with normals", async ({ page }) => {
  await page.goto("/place/8504423-subang-jaya/history");
  await expect(page.getByRole("heading", { level: 1, name: "Subang Jaya" })).toBeVisible();
  const glance = page.getByRole("region", { name: "The year at a glance" });
  await expect(glance.getByText("Rainfall")).toBeVisible();
  await expect(glance.getByText("Warmest day")).toBeVisible();
  await expect(page.getByRole("region", { name: "Daily highs" })).toBeVisible();

  await page.getByText("Monthly Rainfall as a Table").click();
  await expect(
    page.getByRole("table", { name: "Monthly rainfall against normal" }).getByRole("row"),
  ).toHaveCount(13);

  // Navigation between a place's views.
  await page
    .getByRole("navigation", { name: "Location Sections" })
    .getByRole("link", { name: "Forecast" })
    .click();
  await expect(page).toHaveURL(/\/place\/8504423-subang-jaya$/);
});

test("the forecast page reads now, alerts, what's next, then the detailed readings", async ({
  page,
}) => {
  await page.goto("/place/8504423-subang-jaya");
  const top = async (name: string, level = 2) =>
    (await page.getByRole("heading", { level, name }).boundingBox())!.y;
  // Current conditions open the page: the hero carries the temperature and the day's four numbers.
  const hero = page.locator("header").filter({
    has: page.getByRole("heading", { level: 1, name: "Subang Jaya" }),
  });
  await expect(hero.getByText("Feels Like")).toBeVisible();
  await expect(hero.getByText("Rain Today")).toBeVisible();
  expect(await top("Subang Jaya", 1)).toBeLessThan(await top("Alerts"));
  expect(await top("Alerts")).toBeLessThan(await top("Next 48 hours"));
  expect(await top("Next 48 hours")).toBeLessThan(await top("Right now"));
});
