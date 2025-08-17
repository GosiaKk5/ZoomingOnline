/**
 * Global application state stores using Svelte's reactivity system
 */
import { writable, derived, type Writable, type Readable } from "svelte/store";

// Type definitions for better type safety
export interface PlotConfig {
  total_time_us: number;
  overview_window_us: number;
  zoom1_window_us: number;
  zoom2_window_us: number;
  zoom1_position: number;
  zoom2_position: number;
  selectedChannelData: any | null;
  selectedTrcData: any | null;
  selectedSegmentData: any | null;
}

export interface CacheEntry {
  key: string | null;
  data: any | null;
}

export interface TimeStep {
  label: string;
  value_us: number;
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
  total_time_us: 0,
  overview_window_us: 0,
  zoom1_window_us: 0,
  zoom2_window_us: 0,
  zoom1_position: 50,
  zoom2_position: 50,
  selectedChannelData: null,
  selectedTrcData: null,
  selectedSegmentData: null,
});

// Cache store for performance optimization
export const lastChunkCache: Writable<CacheEntry> = writable({
  key: null,
  data: null,
});

// Time steps store
export const timeSteps: Writable<TimeStep[]> = writable([]);

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
    total_time_us: 0,
    overview_window_us: 0,
    zoom1_window_us: 0,
    zoom2_window_us: 0,
    zoom1_position: 50,
    zoom2_position: 50,
    selectedChannelData: null,
    selectedTrcData: null,
    selectedSegmentData: null,
  });
  lastChunkCache.set({ key: null, data: null });
  timeSteps.set([]);
  showCopyLink.set(false);
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
