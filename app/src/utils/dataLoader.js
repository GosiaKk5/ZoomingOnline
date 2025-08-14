/**
 * dataLoader.js
 * 
 * This module handles loading and retrieving Zarr-formatted data from a URL.
 * It provides functions to load remote data and efficiently retrieve slices
 * of the dataset with chunk-based caching using Svelte stores.
 */

import { openGroup, openArray, slice, HTTPStore } from "zarr";
import { 
    zarrGroup, 
    rawStore, 
    overviewStore, 
    lastChunkCache,
    setLoadingState,
    setError
} from '../stores/appStore.js';

/**
 * Load Zarr data from a remote URL
 * @param {string} url - URL of the Zarr store
 */
export async function loadZarrData(url) {
    try {
        setLoadingState(true);
        
        // Create HTTP store for remote access
        const store = new HTTPStore(url);
        
        // Open the Zarr group and arrays
        const group = await openGroup(store);
        const raw = await openArray({ store, path: 'raw' });
        const overview = await openArray({ store, path: 'overview/0' });

        // Update stores
        zarrGroup.set(group);
        rawStore.set(raw);
        overviewStore.set(overview);
        lastChunkCache.set({ key: null, data: null }); // Reset cache on new load
        
        setLoadingState(false);
    } catch (error) {
        setError(`Failed to load Zarr data: ${error.message}`);
        throw error;
    }
}

/**
 * Get a slice of raw data with efficient chunk caching
 * @param {Object} rawStoreObj - Raw store object
 * @param {Object} cacheObj - Cache object
 * @param {number} ch - Channel index
 * @param {number} trc - TRC index
 * @param {number} seg - Segment index
 * @param {number} start - Start sample index
 * @param {number} end - End sample index
 * @returns {TypedArray} - Array of data points for the requested range
 */
export async function getRawDataSlice(rawStoreObj, cacheObj, ch, trc, seg, start, end) {
    const chunkSize = rawStoreObj.meta.chunks[3];
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
        if (cacheObj.key === cacheKey) {
            chunkData = cacheObj.data;
        } else {
            // Otherwise fetch from remote store
            const chunkStart = i * chunkSize;
            const chunkEnd = Math.min((i + 1) * chunkSize, rawStoreObj.shape[3]);
            const fetchedSlice = await rawStoreObj.get([ch, trc, seg, slice(chunkStart, chunkEnd)]);
            chunkData = fetchedSlice.data;
            
            // Update cache with this chunk
            lastChunkCache.update(() => ({ key: cacheKey, data: chunkData }));
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
