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
    if (!store || !store.shape) {
        return { channels: [], trcFiles: [], segments: [] };
    }
    
    const [channelCount, trcCount, segmentCount] = store.shape;
    
    // Create arrays of options
    const channels = Array.from({ length: channelCount }, (_, i) => `Channel ${i + 1}`);
    const trcFiles = Array.from({ length: trcCount }, (_, i) => `TRC ${i + 1}`);
    const segments = Array.from({ length: segmentCount }, (_, i) => `Segment ${i + 1}`);
    
    return { channels, trcFiles, segments };
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
