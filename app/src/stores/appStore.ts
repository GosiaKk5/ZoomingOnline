/**
 * Global application state stores using Svelte's reactivity system
 */
import { writable, derived, type Writable, type Readable } from "svelte/store";

// Type definitions for better type safety
export interface PlotConfig {
  total_time_s: number;
  selectedChannelData: any | null;
  selectedTrcData: any | null;
  selectedSegmentData: any | null;
  // Additional fields from PlotDataResult
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  width?: number;
  height?: number;
  fullWidth?: number;
  chartHeight?: number;
  horiz_interval?: number;
  no_of_samples?: number;
  adcToMv?: (adc: number) => number;
  channel?: number;
  trc?: number;
  segment?: number;
  overviewData?: Array<{
    time_s: number;
    min_mv: number;
    max_mv: number;
  }>;
  globalYMin?: number | undefined;
  globalYMax?: number | undefined;
}

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

// UI state stores
export const isLoading: Writable<boolean> = writable(false);
export const error: Writable<string | null> = writable(null);

// Selection state stores
export const selectedChannel: Writable<string> = writable("");
export const selectedTrc: Writable<string> = writable("");
export const selectedSegment: Writable<string> = writable("");

// Plot configuration store
export const plotConfig: Writable<PlotConfig> = writable({
  total_time_s: 0,
  selectedChannelData: null,
  selectedTrcData: null,
  selectedSegmentData: null,
});

// Cache store for performance optimization
export const lastChunkCache: Writable<CacheEntry> = writable({
  key: null,
  data: null,
});

// Derived stores for computed values
export const isDataReadyForPlot: Readable<boolean> = derived(
  [selectedChannel, selectedTrc, selectedSegment, isDataLoaded],
  ([$selectedChannel, $selectedTrc, $selectedSegment, $isDataLoaded]) =>
    Boolean(
      $isDataLoaded && $selectedChannel && $selectedTrc && $selectedSegment,
    ),
);

export const currentDataUrl: Readable<string> = derived(
  [dataUrl],
  ([$dataUrl]) => $dataUrl,
);

// UI control stores
export const showCopyLink: Writable<boolean> = writable(false);

// Zoom rectangle state stores
export const zoomPosition: Writable<number> = writable(0.5); // Position as percentage (0-1) of total time
export const zoomWidth: Writable<number> = writable(0.1); // Width as percentage (0-1) of total time

// Helper functions to reset state
export function resetAppState(): void {
  zarrGroup.set(null);
  rawStore.set(null);
  overviewStore.set(null);
  dataUrl.set("");
  isDataLoaded.set(false);
  isLoading.set(false);
  error.set(null);
  selectedChannel.set("");
  selectedTrc.set("");
  selectedSegment.set("");
  plotConfig.set({
    total_time_s: 0,
    selectedChannelData: null,
    selectedTrcData: null,
    selectedSegmentData: null,
  });
  lastChunkCache.set({ key: null, data: null });
  showCopyLink.set(false);
  zoomPosition.set(0.5);
  zoomWidth.set(0.1);
}

export function setLoadingState(loading: boolean): void {
  isLoading.set(loading);
  if (loading) {
    error.set(null);
  }
}

export function setError(errorMessage: string): void {
  error.set(errorMessage);
  isLoading.set(false);
}
