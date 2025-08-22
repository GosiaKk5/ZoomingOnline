// @ts-check
import { defineConfig } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  /* Define test match pattern to include our browser_tests.js file */
  testMatch: ["**/*.spec.js", "**/*test*.js", "**/browser_tests.js"],
  timeout: 60000, // 60 seconds for tests that load data and render charts
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [
    {
      name: "chromium",
      use: {
        headless: true,
        viewport: { width: 1920, height: 1200 },
        ignoreHTTPSErrors: true,
        screenshot: "only-on-failure",
        trace: "on-first-retry",
        // Increased timeouts for CI
        actionTimeout: 15000,
        navigationTimeout: 30000,
      },
    },
  ],
  /**
   * Web server configuration
   * - In CI: reuse existing server (started by GitHub Actions)
   * - Locally: start dev server automatically
   */
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:5173/",
        reuseExistingServer: true,
        timeout: 120 * 1000, // 2 minutes
      },
  use: {
    baseURL: "http://localhost:5173/",
  },
});
