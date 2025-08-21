import { test, expect } from "@playwright/test";

test.describe("Selection Form Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Log browser console for debugging
    page.on("console", (msg) => {
      console.log(`[browser:${msg.type()}]`, msg.text());
    });
    
    // Listen for JavaScript errors
    page.on('pageerror', (error) => {
      throw new Error(`Page error: ${error.message}`);
    });
  });

  test("channel selection should work without errors", async ({ page }) => {
    await page.goto("/");
    
    // Load example data
    await page.click('button:has-text("Load Example Data")');
    await expect(page).toHaveURL(/\/selection/, { timeout: 15000 });
    
    // Wait for form to load
    await page.waitForSelector("#channel-select", { timeout: 30000 });
    
    // Initial value check
    const channelSelect = page.locator("#channel-select");
    const initialValue = await channelSelect.inputValue();
    console.log("Initial channel:", initialValue);
    
    // Test channel selection change
    await channelSelect.selectOption("2");
    await page.waitForTimeout(1000);
    
    const newValue = await channelSelect.inputValue();
    expect(newValue).toBe("2");
    console.log("Changed channel to:", newValue);
    
    // Test TRC selection change
    const trcSelect = page.locator("#trc-select");
    await trcSelect.selectOption("3");
    await page.waitForTimeout(1000);
    
    const trcValue = await trcSelect.inputValue();
    expect(trcValue).toBe("3");
    console.log("Changed TRC to:", trcValue);
    
    // Test Segment selection change
    const segmentSelect = page.locator("#segment-select");
    await segmentSelect.selectOption("5");
    await page.waitForTimeout(1000);
    
    const segmentValue = await segmentSelect.inputValue();
    expect(segmentValue).toBe("5");
    console.log("Changed segment to:", segmentValue);
    
    console.log("✓ All selection changes completed without errors");
  });
});