// @ts-check
import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        // Increased timeouts for CI
        actionTimeout: 15000,
        navigationTimeout: 30000,
      },
    },
  ],
  /**
   * Web server configuration for local testing only
   * In CI, the server is started manually for better control
   */
  webServer: undefined, // Don't auto-start server, use existing one
  use: {
    baseURL: "http://localhost:5173/",
  },
});
