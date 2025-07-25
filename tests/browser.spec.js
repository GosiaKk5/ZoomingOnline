const { test, expect } = require('@playwright/test');

test.describe('ZoomingOnline Browser Tests', () => {

  test('Load remote dataset via URL parameter', async ({ page }) => {
    // Navigate to the app with data parameter
    await page.goto('http://localhost:8000/website/?data=https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr');
    await expect(page).toHaveTitle('Interactive Raw Data Analysis Plot');
    
    // Check if the selection container becomes visible (data loaded automatically)
    const selectionContainer = await page.locator('#selection-container');
    await expect(selectionContainer).toBeVisible({ timeout: 30000 });
    
    // Select specific options
    await page.selectOption('#channel-select', '2');
    await page.selectOption('#trc-select', '3');
    await page.selectOption('#segment-select', '4');
    
    // Plot the selected data
    await page.click('#plot-button');
    
    // Wait for charts to appear
    const chartContainer = await page.locator('#chart-container');
    await expect(chartContainer).toBeVisible({ timeout: 30000 });
    
    // Verify all three charts are visible
    await expect(page.locator('#overview-chart')).toBeVisible();
    await expect(page.locator('#zoom1-chart')).toBeVisible();
    await expect(page.locator('#zoom2-chart')).toBeVisible();
    
    // Verify controls are visible
    await expect(page.locator('.controls')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'remote-data-url-param-test.png' });
  });

  test('Load remote dataset via input field', async ({ page }) => {
    // Navigate to the app 
    await page.goto('http://localhost:8000/website/');
    await expect(page).toHaveTitle('Interactive Raw Data Analysis Plot');
    
    // Check if the input container is visible
    const inputContainer = await page.locator('#input-container');
    await expect(inputContainer).toBeVisible();
    
    // Load example data through input field
    await page.fill('#zarr-input', 'https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr');
    await page.click('#load-button');
    
    // Wait for data to load
    const selectionContainer = await page.locator('#selection-container');
    await expect(selectionContainer).toBeVisible({ timeout: 30000 });
    
    // Select channel, TRC file, and segment
    await page.selectOption('#channel-select', '2');
    await page.selectOption('#trc-select', '3');
    await page.selectOption('#segment-select', '4');
    
    // Plot the selected data
    await page.click('#plot-button');
    
    // Wait for charts to appear
    const chartContainer = await page.locator('#chart-container');
    await expect(chartContainer).toBeVisible({ timeout: 30000 });
    
    // Verify all three charts are visible
    await expect(page.locator('#overview-chart')).toBeVisible();
    await expect(page.locator('#zoom1-chart')).toBeVisible();
    await expect(page.locator('#zoom2-chart')).toBeVisible();
    
    // Verify controls are visible
    await expect(page.locator('.controls')).toBeVisible();
    
    // Test slider interaction
    await page.locator('#zoom1-pos').fill('75');
    await page.locator('#zoom2-pos').fill('25');
    
    // Take screenshot
    await page.screenshot({ path: 'remote-data-input-field-test.png' });
  });
});
