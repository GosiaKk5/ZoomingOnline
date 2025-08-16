import { test, expect } from '@playwright/test';

test('Debug selector options', async ({ page }) => {
    const baseURL = 'http://localhost:5173/ZoomingOnline/';
    const dataUrl = 'https://s3.cloud.cyfronet.pl/zooming-online/1nA/1nA.zarr';
    
    // Navigate to the app with data parameter
    await page.goto(`${baseURL}?data=${dataUrl}`);
    console.log('Navigated to app with data URL');
    
    // Wait for data to load
    await page.waitForSelector('.selection-container', { timeout: 60000 });
    console.log('Selection container is visible');
    
    // Wait a bit for selectors to populate
    await page.waitForTimeout(5000);
    
    // Check what options are available in each select
    const channelOptions = await page.locator('#channel-select option').allTextContents();
    console.log('Channel options:', channelOptions);
    
    const trcOptions = await page.locator('#trc-select option').allTextContents();
    console.log('TRC options:', trcOptions);
    
    const segmentOptions = await page.locator('#segment-select option').allTextContents();
    console.log('Segment options:', segmentOptions);
    
    // Check which options are currently selected
    const selectedChannel = await page.locator('#channel-select').inputValue();
    const selectedTrc = await page.locator('#trc-select').inputValue();
    const selectedSegment = await page.locator('#segment-select').inputValue();
    
    console.log('Selected values:');
    console.log('  Channel:', selectedChannel);
    console.log('  TRC:', selectedTrc);
    console.log('  Segment:', selectedSegment);
    
    // Try to select the first available option in each
    if (channelOptions.length > 0) {
        await page.selectOption('#channel-select', { index: 0 });
        console.log('Selected first channel option');
    }
    
    if (trcOptions.length > 0) {
        await page.selectOption('#trc-select', { index: 0 });
        console.log('Selected first TRC option');
    }
    
    if (segmentOptions.length > 0) {
        await page.selectOption('#segment-select', { index: 0 });
        console.log('Selected first segment option');
    }
    
    await page.screenshot({ path: 'debug-selectors.png' });
});
