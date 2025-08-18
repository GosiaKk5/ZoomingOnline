/**
 * Data loading and management store
 * Handles Zarr data loading, caching, and data state management
 */
import { writable, derived, type Writable, type Readable } from "svelte/store";

export interface CacheEntry {
  key: string | null;
  data: any | null;
}

// Data-related stores
export const zarrGroup: Writable<any | null> = writable(null);
export const rawStore: Writable<any | null> = writable(null);
export const overviewStore: Writable<any | null> = writable(null);
export const dataUrl: Writable<string> = writable("");
export const isDataLoaded: Writable<boolean> = writable(false);
export const dataVersion: Writable<number> = writable(0);

// Cache store for performance optimization
export const lastChunkCache: Writable<CacheEntry> = writable({
  key: null,
  data: null,
});

// Derived stores
export const currentDataUrl: Readable<string> = derived(
  [dataUrl],
  ([$dataUrl]) => $dataUrl
);

export const isDataReady: Readable<boolean> = derived(
  [rawStore, overviewStore, isDataLoaded],
  ([$rawStore, $overviewStore, $isDataLoaded]) =>
    Boolean($isDataLoaded && $rawStore && $overviewStore)
);

export const hasValidData: Readable<boolean> = derived(
  [zarrGroup, rawStore, overviewStore],
  ([$zarrGroup, $rawStore, $overviewStore]) =>
    Boolean($zarrGroup && $rawStore && $overviewStore)
);

// Helper functions for data management
export function resetDataState(): void {
  zarrGroup.set(null);
  rawStore.set(null);
  overviewStore.set(null);
  dataUrl.set("");
  isDataLoaded.set(false);
  lastChunkCache.set({ key: null, data: null });
  dataVersion.update(v => v + 1);
}

export function setDataLoaded(loaded: boolean): void {
  isDataLoaded.set(loaded);
  if (loaded) {
    dataVersion.update(v => v + 1);
  }
}

export function updateCache(key: string, data: any): void {
  lastChunkCache.set({ key, data });
}

export function clearCache(): void {
  lastChunkCache.set({ key: null, data: null });
}