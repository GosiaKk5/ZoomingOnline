/**
 * dataLoader.js
 * 
 * This module handles loading and retrieving Zarr-formatted data from a URL.
 * It provides functions to load remote data and efficiently retrieve slices
 * of the dataset with chunk-based caching.
 */

import { openGroup, openArray, slice, HTTPStore } from "https://cdn.skypack.dev/zarr";

// Module-level variables to hold Zarr data structures
let zarrGroup = null;
let rawStore = null;
let overviewStore = null;

/**
 * Load Zarr data from a remote URL
 * @param {string} url - URL of the Zarr store
 */
export async function loadZarrData(url) {
    // Create HTTP store for remote access
    const store = new HTTPStore(url);
    
    // Open the Zarr group and arrays
    zarrGroup = await openGroup(store);
    rawStore = await openArray({ store, path: 'raw' });
    overviewStore = await openArray({ store, path: 'overview/0' });

    // Update global app state accessible by other modules
    window.appState.zarrGroup = zarrGroup;
    window.appState.rawStore = rawStore;
    window.appState.overviewStore = overviewStore;
    window.appState.lastChunkCache = { key: null, data: null }; // Reset cache on new load
}

/**
 * Get a slice of raw data with efficient chunk caching
 * @param {number} ch - Channel index
 * @param {number} trc - TRC index
 * @param {number} seg - Segment index
 * @param {number} start - Start sample index
 * @param {number} end - End sample index
 * @returns {TypedArray} - Array of data points for the requested range
 */
export async function getRawDataSlice(ch, trc, seg, start, end) {
    const chunkSize = rawStore.meta.chunks[3];
    const startChunkIdx = Math.floor(start / chunkSize);
    const endChunkIdx = Math.floor((end - 1) / chunkSize);

    // Create buffer for the final data
    let finalData = new Int16Array(end - start);
    let finalDataOffset = 0;

    // Fetch data chunk by chunk, using cache when possible
    for (let i = startChunkIdx; i <= endChunkIdx; i++) {
        const cacheKey = `${ch}-${trc}-${seg}-${i}`;
        let chunkData;

        // Check if we have this chunk in cache
        if (window.appState.lastChunkCache.key === cacheKey) {
            chunkData = window.appState.lastChunkCache.data;
        } else {
            // Otherwise fetch from remote store
            const chunkStart = i * chunkSize;
            const chunkEnd = Math.min((i + 1) * chunkSize, rawStore.shape[3]);
            const fetchedSlice = await rawStore.get([ch, trc, seg, slice(chunkStart, chunkEnd)]);
            chunkData = fetchedSlice.data;
            
            // Update cache with this chunk
            window.appState.lastChunkCache = { key: cacheKey, data: chunkData };
        }

        // Calculate the portion of this chunk needed for our result
        const reqStartInChunk = Math.max(0, start - i * chunkSize);
        const reqEndInChunk = Math.min(chunkSize, end - i * chunkSize);

        // Copy the relevant portion to our result buffer
        const sliced = chunkData.subarray(reqStartInChunk, reqEndInChunk);
        finalData.set(sliced, finalDataOffset);
        finalDataOffset += sliced.length;
    }
    return finalData;
}

// Export these for direct access if necessary, though `appState` is the preferred way
export { zarrGroup, rawStore, overviewStore };