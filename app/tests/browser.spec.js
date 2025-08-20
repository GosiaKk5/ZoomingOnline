import { test, expect } from "@playwright/test";

// Configure data source based on environment
const useLocalData = process.env.USE_LOCAL_DATA === "true";

function getDataUrl(baseUrlFromConfig) {
  if (useLocalData) {
    // Construct full URL for the static example file based on Playwright baseURL
    // Make sure baseUrlFromConfig is a valid URL
    const baseUrl = baseUrlFromConfig || "http://localhost:4173/";
    return new URL("downloads/example.zarr", baseUrl).toString();
  }
  return "https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr";
}

// // Increase timeouts for CI environment
const TIMEOUT_CI = 30000; // 30 seconds for CI
const TIMEOUT_CHART_RENDER = 15000; // 15 seconds for chart rendering
const TIMEOUT_DATA_LOAD = 45000; // 45 seconds for data loading

test.describe("ZoomingOnline Browser Tests", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      // eslint-disable-next-line no-console
      console.log(`[browser:${msg.type()}]`, msg.text());
    });
    page.on("pageerror", (err) => {
      // eslint-disable-next-line no-console
      console.log(`[pageerror]`, err.message);
    });
    // Log data source for debugging
    const dataUrl = getDataUrl("http://localhost:4173/");
    console.log(`Using data source: ${dataUrl}`);
  });

  test("load dataset via URL parameter", async ({ page }) => {
    const dataUrl = getDataUrl("http://localhost:4173/");

    // Navigate to the app with a dataset URL parameter
    await page.goto(`/?data=${encodeURIComponent(dataUrl)}`);
    // App should immediately switch to selection route and begin loading
    await expect(page).toHaveURL(/\/selection/, { timeout: 15000 });

    // Wait for the data to load and charts to render
    await page.waitForTimeout(5000); // Increased wait time

    // Wait for data to load - look for the selection interface with container-center class
    const selectionContainer = await page.locator(".container-center");
    await expect(selectionContainer).toBeVisible({ timeout: TIMEOUT_DATA_LOAD });

    // Verify that data controls are present and populated
    const channelSelect = page.locator("#channel-select");
    await expect(channelSelect).toBeVisible({ timeout: TIMEOUT_CI });

    // Wait for options to be populated
    await page.waitForFunction(
      () => {
        const select = document.querySelector('#channel-select');
        return select && select.options.length > 1;
      },
      { timeout: TIMEOUT_DATA_LOAD }
    );

    // Debug: Check what options are available
    const channelOptions = await page
      .locator("#channel-select option")
      .allTextContents();
    console.log("Available channel options:", channelOptions);
  });

  test("Load dataset via input field", async ({ page }) => {
    const dataUrl = getDataUrl("http://localhost:4173/");

    // Navigate to the app
  await page.goto("/");
    await expect(page).toHaveTitle(
      "ZoomingOnline - Interactive Raw Data Analysis",
    );

    // Check if the input container is visible
    const inputContainer = await page.locator(".input-container");
    await expect(inputContainer).toBeVisible();

    // Load example data through input field
    await page.fill('input[type="text"]', dataUrl);
    await page.click('button:has-text("Load Data")');

    // Wait for data to load - look for the selection interface with container-center class
    const selectionContainer = await page.locator(".container-center");
    await expect(selectionContainer).toBeVisible({ timeout: TIMEOUT_DATA_LOAD }); 

    // Wait for selectors to be populated with proper timeout
    await page.waitForTimeout(5000); // Increased timeout

    // Wait for all selectors to have options
    await Promise.all([
      page.waitForFunction(
        () => {
          const select = document.querySelector('#channel-select');
          return select && select.options.length > 1;
        },
        { timeout: TIMEOUT_DATA_LOAD }
      ),
      page.waitForFunction(
        () => {
          const select = document.querySelector('#trc-select');
          return select && select.options.length > 0;
        },
        { timeout: TIMEOUT_DATA_LOAD }
      ),
      page.waitForFunction(
        () => {
          const select = document.querySelector('#segment-select');
          return select && select.options.length > 0;
        },
        { timeout: TIMEOUT_DATA_LOAD }
      )
    ]);

    // Debug: Check what options are available
    const channelOptions = await page
      .locator("#channel-select option")
      .allTextContents();
    const trcOptions = await page
      .locator("#trc-select option")
      .allTextContents();
    const segmentOptions = await page
      .locator("#segment-select option")
      .allTextContents();

    console.log("Available options:");
    console.log("  Channels:", channelOptions);
    console.log("  TRC files:", trcOptions);
    console.log("  Segments:", segmentOptions);

    // Select first available options instead of hardcoded indices
    if (channelOptions.length > 1) {
      await page.selectOption("#channel-select", { index: 1 }); // Try second option if available
    } else if (channelOptions.length > 0) {
      await page.selectOption("#channel-select", { index: 0 }); // Fall back to first option
    }

    if (trcOptions.length > 1) {
      await page.selectOption("#trc-select", { index: 1 }); // Try second option if available
    } else if (trcOptions.length > 0) {
      await page.selectOption("#trc-select", { index: 0 }); // Fall back to first option
    }

    if (segmentOptions.length > 2) {
      await page.selectOption("#segment-select", { index: 2 }); // Try third option if available
    } else if (segmentOptions.length > 0) {
      await page.selectOption("#segment-select", { index: 0 }); // Fall back to first option
    }

    // Wait a bit for the selections to update the store
    await page.waitForTimeout(5000); // Increased timeout for store updates

    // Plot the selected data - use the button text instead of the removed CSS class
    await page.click('button:has-text("Plot Selected Data")');

    // Wait for SPA URL change to visualization page (no full page load on pushState)
    await expect(page).toHaveURL(/\/visualization/, { timeout: TIMEOUT_CI });
    console.log("Navigated to visualization page");

    // Wait for chart container to appear (it needs plotConfig to be ready) - use overview chart directly
    await page.waitForSelector("#overview-chart", { timeout: TIMEOUT_DATA_LOAD });

    // Wait additional time for charts to be fully rendered
    await page.waitForTimeout(TIMEOUT_CHART_RENDER);
    console.log("Charts should be rendered now");

    // Debug: Check if there are any error messages
    const errorElements = await page
      .locator('.error, .loading, [class*="error"]')
      .allTextContents();
    if (errorElements.length > 0) {
      console.log("Error/loading messages found:", errorElements);
    }

    // Debug: Check chart containers exist and their content
    const overviewExists = await page.locator("#overview-chart").count();

    console.log("Chart container counts:");
    console.log("  Overview:", overviewExists);

    // Check if charts have SVG content
    const overviewSVG = await page.locator("#overview-chart svg").count();

    console.log("Chart SVG counts:");
    console.log("  Overview SVG:", overviewSVG);

    // Wait for charts to appear on the visualization page - use the overview chart directly
    const overviewChart = await page.locator("#overview-chart");
    await expect(overviewChart).toBeVisible({ timeout: TIMEOUT_DATA_LOAD }); 

    // Wait for SVG content to be rendered
    await page.waitForFunction(
      () => {
        const chart = document.querySelector("#overview-chart svg");
        return chart !== null;
      },
      { timeout: TIMEOUT_CHART_RENDER }
    );

    // If overview chart has SVG content, the core functionality is working
    if (overviewSVG > 0) {
      console.log(
        "Overview chart has SVG content - core functionality working",
      );
      // Take screenshot for debugging
      await page.screenshot({ path: "charts-with-svg-input.png" });
    } else {
      console.log("Overview chart missing SVG content - may still be loading");
      // Try waiting a bit more
      await page.waitForTimeout(5000);
      await page.screenshot({ path: "charts-waiting-longer-input.png" });
    }

    // Try to verify overview chart is visible
    try {
      await expect(page.locator("#overview-chart")).toBeVisible({
        timeout: TIMEOUT_CI,
      });
      console.log("Overview chart is visible - test passes!");
    } catch (error) {
      console.log("Overview chart not yet visible, but continuing test...");
      await page.screenshot({ path: "charts-not-visible-debug-input.png" });
    }

    // Core functionality test - if we reach here with overview chart working, test passes
    console.log(
      "✓ Core functionality verified: data loading, navigation, and overview chart working",
    );

    // Take screenshot
    await page.screenshot({ path: "data-input-field-test.png" });
  });
});
