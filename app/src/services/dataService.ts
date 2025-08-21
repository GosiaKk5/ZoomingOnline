/**
 * dataService.ts
 *
 * Service for loading and retrieving Zarr-formatted data from a URL.
 * Orchestrates store updates and provides data access helpers.
 */

import { openGroup, openArray, slice, HTTPStore } from "zarr";
import {
  actions
} from "../stores";

/**
 * Reset all application state (replacement for old resetAppState)
 */
function resetAppState(): void {
  actions.reset();
}

/**
 * Load Zarr data from a remote URL
 */
export async function loadZarrData(url: string): Promise<void> {
  try {
    resetAppState();
    
    actions.setLoading(true);

    // Create HTTP store for remote access
    const store = new HTTPStore(url);

    // Open the Zarr group and arrays with timeout
    const group = await Promise.race([
      openGroup(store),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout opening group")), 10000),
      ),
    ]);

    const raw = await Promise.race([
      openArray({ store, path: "raw" }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout opening raw array")), 10000),
      ),
    ]);

    let overview: any;
    try {
      overview = await Promise.race([
        openArray({ store, path: "overview/0" }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout opening overview array")),
            10000,
          ),
        ),
      ]);
    } catch (overviewError) {
      overview = null;
    }

    // Update stores
    actions.setData({
      zarrGroup: group,
      rawStore: raw,
      overviewStore: overview,
      url: url,
      isLoaded: true
    });

    actions.setLoading(false);
  } catch (error) {
    actions.setLoading(false); // Make sure to reset loading state on error
    actions.setError(`Failed to load Zarr data: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get a slice of raw data with efficient chunk caching
 */
export async function getRawDataSlice(
  rawStoreObj: any,
  ch: number,
  trc: number,
  seg: number,
  start: number,
  end: number,
): Promise<Int16Array> {
  const chunkSize = rawStoreObj.meta.chunks[3] as number;
  const startChunkIdx = Math.floor(start / chunkSize);
  const endChunkIdx = Math.floor((end - 1) / chunkSize);

  // Create buffer for the final data
  const finalData = new Int16Array(end - start);
  let finalDataOffset = 0;

  // Fetch data chunk by chunk (simplified without cache for now)
  for (let i = startChunkIdx; i <= endChunkIdx; i++) {
    // Fetch from remote store
    const chunkStart = i * chunkSize;
    const chunkEnd = Math.min((i + 1) * chunkSize, rawStoreObj.shape[3]);
    const fetchedSlice = await rawStoreObj.get([
      ch,
      trc,
      seg,
      slice(chunkStart, chunkEnd),
    ]);
    const chunkData = fetchedSlice.data as Int16Array;

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
