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
        console.log('🔗 dataLoader.loadZarrData() called');
        console.log('  - URL:', url);
        
        setLoadingState(true);
        console.log('  - Loading state set to true via setLoadingState()');
        
        // Create HTTP store for remote access
        console.log('🌐 Creating HTTPStore...');
        const store = new HTTPStore(url);
        console.log('  - HTTPStore created successfully');
        
        // Open the Zarr group and arrays with timeout
        console.log('📂 Opening Zarr group...');
        const group = await Promise.race([
            openGroup(store),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout opening group')), 10000))
        ]);
        console.log('  - Group opened:', group);
        
        console.log('📁 Opening raw array...');
        const raw = await Promise.race([
            openArray({ store, path: 'raw' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout opening raw array')), 10000))
        ]);
        console.log('  - Raw array opened:', raw);
        console.log('  - Raw array shape:', raw?.shape);
        
        console.log('🔍 Opening overview array...');
        let overview;
        try {
            overview = await Promise.race([
                openArray({ store, path: 'overview/0' }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout opening overview array')), 10000))
            ]);
            console.log('  - Overview array opened:', overview);
            console.log('  - Overview array shape:', overview?.shape);
        } catch (overviewError) {
            console.warn('⚠️ Failed to open overview array, continuing without it:');
            console.warn('  - Error:', overviewError);
            overview = null;
        }

        // Update stores
        console.log('💾 Updating application stores...');
        zarrGroup.set(group);
        rawStore.set(raw);
        overviewStore.set(overview);
        lastChunkCache.set({ key: null, data: null }); // Reset cache on new load
        console.log('  - All stores updated successfully');
        
        setLoadingState(false);
        console.log('✅ Data loading completed successfully');
        
    } catch (error) {
        console.error('❌ Error in loadZarrData():');
        console.error('  - Error:', error);
        console.error('  - URL that failed:', url);
        console.error('  - Error type:', error.constructor.name);
        setLoadingState(false); // Make sure to reset loading state on error
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
