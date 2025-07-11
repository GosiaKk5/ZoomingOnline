import { openGroup, openArray, slice, HTTPStore } from "https://cdn.skypack.dev/zarr";

let zarrGroup = null;
let rawStore = null;
let overviewStore = null;
let lastChunkCache = { key: null, data: null };

export async function loadZarrData(url) {
    const store = new HTTPStore(url);
    zarrGroup = await openGroup(store);
    rawStore = await openArray({ store, path: 'raw' });
    overviewStore = await openArray({ store, path: 'overview/0' });

    // Update global app state accessible by other modules
    window.appState.zarrGroup = zarrGroup;
    window.appState.rawStore = rawStore;
    window.appState.overviewStore = overviewStore;
    window.appState.lastChunkCache = { key: null, data: null }; // Reset cache on new load
}

export async function getRawDataSlice(ch, trc, seg, start, end) {
    const chunkSize = rawStore.meta.chunks[3];
    const startChunkIdx = Math.floor(start / chunkSize);
    const endChunkIdx = Math.floor((end - 1) / chunkSize);

    let finalData = new Int16Array(end - start);
    let finalDataOffset = 0;

    for (let i = startChunkIdx; i <= endChunkIdx; i++) {
        const cacheKey = `${ch}-${trc}-${seg}-${i}`;
        let chunkData;

        if (window.appState.lastChunkCache.key === cacheKey) {
            chunkData = window.appState.lastChunkCache.data;
        } else {
            const chunkStart = i * chunkSize;
            const chunkEnd = Math.min((i + 1) * chunkSize, rawStore.shape[3]);
            const fetchedSlice = await rawStore.get([ch, trc, seg, slice(chunkStart, chunkEnd)]);
            chunkData = fetchedSlice.data;
            window.appState.lastChunkCache = { key: cacheKey, data: chunkData };
        }

        const reqStartInChunk = Math.max(0, start - i * chunkSize);
        const reqEndInChunk = Math.min(chunkSize, end - i * chunkSize);

        const sliced = chunkData.subarray(reqStartInChunk, reqEndInChunk);
        finalData.set(sliced, finalDataOffset);
        finalDataOffset += sliced.length;
    }
    return finalData;
}

// Export these for direct access if necessary, though `appState` is the preferred way
export { zarrGroup, rawStore, overviewStore, lastChunkCache };