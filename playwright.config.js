// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Define test match pattern to include our browser_tests.js file */
  testMatch: ['**/*.spec.js', '**/*test*.js', '**/browser_tests.js'],
  /* Maximum time one test can run for - increased for CI environments */
  timeout: process.env.CI ? 180000 : 60000, // 3 minutes in CI, 1 minute locally
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use */
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        // Browser options
        headless: true,
        viewport: { width: 1920, height: 1200 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        // Record trace only on failure
        trace: 'on-first-retry',
      },
    },
  ],
  /* Web server for local testing - disabled for CI to avoid conflicts with run_browser_tests.sh */
  webServer: process.env.CI ? [] : [
    {
      command: 'python src/cors_server.py --port 8000',
      port: 8000,
      reuseExistingServer: true,
    },
  ],
});
