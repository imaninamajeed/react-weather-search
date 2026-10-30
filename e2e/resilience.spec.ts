import { expect, test } from "@playwright/test";

test("unknown places show a helpful not-found page", async ({ page }) => {
  for (const key of ["nope", "999999999-nowhere", "91,10"]) {
    await page.goto(`/place/${key}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "We Couldn't Find That Place" }),
    ).toBeVisible();
    // Next.js emits the tag in both <head> and the streamed body.
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  }
});

test("a non-canonical place URL redirects to the canonical one", async ({ page }) => {
  await page.goto("/place/8504423-some-old-slug");
  await expect(page).toHaveURL(/\/place\/8504423-subang-jaya$/);
  await page.goto("/place/3.0438,101.5806");
  await expect(page).toHaveURL(/\/place\/3\.04%2C101\.58$/);
});

test("one failing upstream degrades a single card, not the page", async ({ page }) => {
  // The mock fails air quality for this latitude only.
  await page.goto("/place/12.34,56.78");
  await expect(page.getByText("Air quality is unavailable")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Next 48 hours" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Next 3 days" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
  await expect(page.getByText("Humidity", { exact: true })).toBeVisible();

  // The two-week outlook is its own page and survives too.
  await page.goto("/place/12.34,56.78/outlook");
  await expect(page.getByRole("heading", { level: 2, name: "14-day outlook" })).toBeVisible();
});
