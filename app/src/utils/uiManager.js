/**
 * uiManager.js
 * 
 * Manages user interface elements and interactions for the ZoomingOnline application.
 * Handles populating selectors, managing UI state, and clipboard functionality.
 * Adapted for Svelte store-based state management.
 */

/**
 * Populate the dropdown selectors for channel, TRC, and segment
 * based on the data dimensions from the loaded store
 * 
 * @param {Object} store - The Zarr data store containing shape information
 * @returns {Object} - Object containing arrays of options for each selector
 */
export async function populateSelectors(store) {
    console.log('🎯 populateSelectors() called');
    console.log('  - store parameter:', store);
    console.log('  - store type:', typeof store);
    console.log('  - store exists:', !!store);
    
    if (!store) {
        console.warn('⚠️ populateSelectors: No store provided');
        return { channels: [], trcFiles: [], segments: [] };
    }
    
    if (!store.shape) {
        console.warn('⚠️ populateSelectors: Store has no shape property');
        console.log('  - Available store properties:', Object.keys(store));
        console.log('  - Store structure:', store);
        return { channels: [], trcFiles: [], segments: [] };
    }
    
    console.log('📐 Store shape analysis:');
    console.log('  - store.shape:', store.shape);
    console.log('  - shape type:', typeof store.shape);
    console.log('  - shape length:', store.shape?.length);
    
    const [channelCount, trcCount, segmentCount] = store.shape;
    console.log('📊 Extracted dimensions:');
    console.log('  - channelCount:', channelCount);
    console.log('  - trcCount:', trcCount); 
    console.log('  - segmentCount:', segmentCount);
    
    // Create arrays of options
    console.log('🔨 Creating selector arrays...');
    const channels = Array.from({ length: channelCount }, (_, i) => `Channel ${i + 1}`);
    const trcFiles = Array.from({ length: trcCount }, (_, i) => `TRC ${i + 1}`);
    const segments = Array.from({ length: segmentCount }, (_, i) => `Segment ${i + 1}`);
    
    console.log('✅ Generated selectors:');
    console.log('  - channels:', channels);
    console.log('  - trcFiles:', trcFiles);
    console.log('  - segments:', segments);
    
    const result = { channels, trcFiles, segments };
    console.log('📤 Returning result:', result);
    
    return result;
}

/**
 * Create a shareable URL with the current data parameter
 * 
 * @param {string} dataUrl - URL of the currently loaded Zarr data
 * @returns {string} - Complete shareable URL
 */
export function createShareableUrl(dataUrl) {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('data', dataUrl);
    return currentUrl.toString();
}

/**
 * Extract the numeric index from a formatted selector value
 * (e.g., "Channel 1" -> 0, "TRC 3" -> 2)
 * 
 * @param {string} value - Formatted value from selector
 * @returns {number} - Zero-based index
 */
export function parseSelectedIndex(value) {
    if (!value) return null;
    const match = value.match(/(\d+)$/);
    return match ? parseInt(match[1]) - 1 : null;
}

/**
 * Get URL parameters from current location
 * 
 * @returns {URLSearchParams} - URL search parameters
 */
export function getUrlParams() {
    return new URLSearchParams(window.location.search);
}
