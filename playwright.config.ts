import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;

/**
 * End-to-end tests run against a production build with every upstream API replaced by captured
 * fixtures (e2e/mock-upstream.mjs), so they are deterministic and need no network.
 * Build first: `pnpm build && pnpm test:e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // First visits default their units from the browser language (en-US is imperial), so pin
    // a metric locale for determinism; one test covers the en-US default explicitly.
    locale: "en-GB",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { NODE_OPTIONS: "--import ./e2e/mock-upstream.mjs" },
  },
});
