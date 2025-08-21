import { test, expect } from "@playwright/test";

test.describe("ZoomingOnline Browser Tests", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`[browser:${msg.type()}]`, msg.text());
    });
  });

  test("load dataset via example button", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("ZoomingOnline - Interactive Raw Data Analysis");
    
    await page.click('button:has-text("Load Example Data")');
    await expect(page).toHaveURL(/\/selection/, { timeout: 15000 });
    
    await page.waitForTimeout(5000);
    const channelSelect = page.locator("#channel-select");
    await expect(channelSelect).toBeVisible({ timeout: 30000 });
    
    console.log("✓ Example loading works");
  });

  test("load dataset via input field", async ({ page }) => {
    await page.goto("/");
    
    await page.fill('input[type="text"]', '/downloads/example.zarr');
    await page.click('button:has-text("Load Data")');
    await expect(page).toHaveURL(/\/selection/, { timeout: 15000 });
    
    await page.waitForTimeout(5000);
    const channelSelect = page.locator("#channel-select");
    await expect(channelSelect).toBeVisible({ timeout: 30000 });
    
    console.log("✓ Input field loading works");
  });

  test("basic navigation", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("Load Example Data")');
    await expect(page).toHaveURL(/\/selection/, { timeout: 15000 });
    console.log("✓ Navigation works");
  });

  test("channel selection changes", async ({ page }) => {
    await page.goto("/");
    
    // Load example data
    await page.click('button:has-text("Load Example Data")');
    await expect(page).toHaveURL(/\/selection/, { timeout: 15000 });
    
    // Wait for data to load and form to be ready
    await page.waitForTimeout(5000);
    const channelSelect = page.locator("#channel-select");
    await expect(channelSelect).toBeVisible({ timeout: 30000 });
    
    // Check initial selection
    const initialValue = await channelSelect.inputValue();
    console.log("Initial channel value:", initialValue);
    
    // Change channel selection
    await channelSelect.selectOption("2");
    await page.waitForTimeout(1000); // Wait for state update
    
    // Verify no JavaScript errors in console
    page.on('pageerror', (error) => {
      throw new Error(`Page error: ${error.message}`);
    });
    
    // Check that selection changed
    const newValue = await channelSelect.inputValue();
    expect(newValue).toBe("2");
    console.log("Channel selection changed to:", newValue);
    
    // Try changing TRC as well
    const trcSelect = page.locator("#trc-select");
    await expect(trcSelect).toBeVisible();
    await trcSelect.selectOption("3");
    await page.waitForTimeout(1000);
    
    const trcValue = await trcSelect.inputValue();
    expect(trcValue).toBe("3");
    console.log("TRC selection changed to:", trcValue);
    
    // Try changing segment as well
    const segmentSelect = page.locator("#segment-select");
    await expect(segmentSelect).toBeVisible();
    await segmentSelect.selectOption("2");
    await page.waitForTimeout(1000);
    
    const segmentValue = await segmentSelect.inputValue();
    expect(segmentValue).toBe("2");
    console.log("Segment selection changed to:", segmentValue);
    
    console.log("✓ Channel, TRC, and Segment selection changes work without errors");
  });
});
