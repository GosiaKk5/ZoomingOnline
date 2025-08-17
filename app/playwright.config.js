// @ts-check
import { defineConfig } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  /* Define test match pattern to include our browser_tests.js file */
  testMatch: ["**/*.spec.js", "**/*test*.js", "**/browser_tests.js"],
  /* Maximum time one test can run for - increased for CI environments */
  timeout: 60000, // 60 seconds for tests that load data and render charts
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use */
  reporter: [["list"], ["html", { open: "never" }]],
  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        // Browser options
        headless: true,
        viewport: { width: 1920, height: 1200 },
        ignoreHTTPSErrors: true,
        screenshot: "only-on-failure",
        // Record trace only on failure
        trace: "on-first-retry",
      },
    },
  ],
  /**
   * Web server configuration for local testing
   * - Uses dev server locally for hot reload during development
   * - Uses preview server in CI for production-like testing
   */
  webServer: process.env.CI
    ? []
    : [
        {
          command: process.env.CI ? "npm run preview" : "npm run dev",
          url: "http://localhost:5173/ZoomingOnline/",
          reuseExistingServer: !process.env.CI,
        },
      ],
  use: {
    baseURL: "http://localhost:5173/ZoomingOnline/",
  },
});
