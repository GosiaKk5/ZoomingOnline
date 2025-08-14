// @ts-check
import { defineConfig } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Define test match pattern to include our browser_tests.js file */
  testMatch: ['**/*.spec.js', '**/*test*.js', '**/browser_tests.js'],
  /* Maximum time one test can run for - increased for CI environments */
  timeout: process.env.CI ? 300000 : 120000, // 5 minutes in CI, 2 minutes locally
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
      command: 'npm run dev',
      url: 'http://localhost:5173/ZoomingOnline/',
      reuseExistingServer: true,
    },
  ],
  use: {
    baseURL: 'http://localhost:5173/ZoomingOnline/',
  },
});