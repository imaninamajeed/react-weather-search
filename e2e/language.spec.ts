import { expect, test } from "@playwright/test";

test.describe("language", () => {
  test("is English until chosen, and Malay once chosen, across reloads and pages", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Language" }).click();
    await page.getByRole("menuitemradio", { name: "Bahasa Melayu" }).click();

    // The shell is prerendered in English and swapped in the browser; the streamed parts come from the server.
    const nav = page.getByRole("navigation", { name: "Utama" });
    await expect(nav.getByRole("link", { name: "Papan Pemuka" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Lokasi" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lokasi Tersimpan" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ms-MY");

    await page.reload();
    await expect(nav.getByRole("link", { name: "Papan Pemuka" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lokasi Tersimpan" })).toBeVisible();

    await nav.getByRole("link", { name: "Makluman" }).click();
    await expect(page).toHaveURL(/\/alerts$/);
    await expect(page.getByRole("heading", { level: 1, name: "Makluman" })).toBeAttached();
  });

  test("can be switched back to English", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "lang", value: "ms", url: baseURL! }]);
    await page.goto("/dashboard");
    await expect(page.getByRole("navigation", { name: "Utama" })).toBeVisible();

    await page.getByRole("button", { name: "Bahasa" }).click();
    await page.getByRole("menuitemradio", { name: "English" }).click();
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  });

  test("translates the welcome page, which has its own switcher", async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([{ name: "lang", value: "ms", url: baseURL! }]);
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Buka Papan Pemuka" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bahasa" })).toBeVisible();
  });

  test("ignores an unrecognised language cookie", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "lang", value: "xx", url: baseURL! }]);
    await page.goto("/dashboard");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  });
});
