import { test, expect } from '@playwright/test';

// Configure data source based on environment
const useLocalData = process.env.USE_LOCAL_DATA === 'true';
const dataUrl = useLocalData 
  ? 'http://localhost:8000/test_data.zarr' 
  : 'https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr';

test.describe('ZoomingOnline Browser Tests', () => {

  test.beforeEach(async () => {
    // Log data source for debugging
    console.log(`Using data source: ${dataUrl}`);
  });

  test('Load dataset via URL parameter', async ({ page }) => {
    // Navigate to the app with data parameter
    await page.goto(`/?data=${dataUrl}`);
    await expect(page).toHaveTitle('ZoomingOnline - Interactive Raw Data Analysis');
    
    // Check if the selection container becomes visible (data loaded automatically)
    const selectionContainer = await page.locator('.selection-container');
    await expect(selectionContainer).toBeVisible({ timeout: 60000 }); // Increased timeout
    
    // Select specific options (for minimal dataset)
    await page.selectOption('#channel-select', '1'); // Second channel (index 1)
    await page.selectOption('#trc-select', '1'); // Second TRC (index 1)
    await page.selectOption('#segment-select', '2'); // Third segment (index 2)
    
    // Plot the selected data
    await page.click('.plot-button');
    
    // Wait for charts to appear
    const chartContainer = await page.locator('.chart-container');
    await expect(chartContainer).toBeVisible({ timeout: 60000 }); // Increased timeout
    
    // Verify all three charts are visible
    await expect(page.locator('#overview-chart')).toBeVisible();
    await expect(page.locator('#zoom1-chart')).toBeVisible();
    await expect(page.locator('#zoom2-chart')).toBeVisible();
    
    // Verify controls are visible
    await expect(page.locator('.controls')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'data-url-param-test.png' });
  });

  test('Load dataset via input field', async ({ page }) => {
    // Navigate to the app 
    await page.goto('/');
    await expect(page).toHaveTitle('ZoomingOnline - Interactive Raw Data Analysis');
    
    // Check if the input container is visible
    const inputContainer = await page.locator('.input-container');
    await expect(inputContainer).toBeVisible();
    
    // Load example data through input field
    await page.fill('#zarr-input', dataUrl);
    await page.click('#load-button');
    
    // Wait for data to load
    const selectionContainer = await page.locator('.selection-container');
    await expect(selectionContainer).toBeVisible({ timeout: 60000 }); // Increased timeout
    
    // Select channel, TRC file, and segment (for minimal dataset)
    await page.selectOption('#channel-select', '1'); // Second channel (index 1)
    await page.selectOption('#trc-select', '1'); // Second TRC (index 1)
    await page.selectOption('#segment-select', '2'); // Third segment (index 2)
    
    // Plot the selected data
    await page.click('.plot-button');
    
    // Wait for charts to appear
    const chartContainer = await page.locator('.chart-container');
    await expect(chartContainer).toBeVisible({ timeout: 60000 }); // Increased timeout
    
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
    await page.screenshot({ path: 'data-input-field-test.png' });
  });
});
