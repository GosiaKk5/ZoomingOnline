/**
 * Global application state stores using Svelte's reactivity system
 */
import { writable, derived } from 'svelte/store';

// Data-related stores
export const zarrGroup = writable(null);
export const rawStore = writable(null);
export const overviewStore = writable(null);
export const dataUrl = writable('');
export const isDataLoaded = writable(false);

// UI state stores
export const isLoading = writable(false);
export const error = writable(null);
export const currentView = writable('input'); // 'input', 'selection', 'visualization'

// Selection state stores
export const selectedChannel = writable('');
export const selectedTrc = writable('');
export const selectedSegment = writable('');

// Plot configuration store
export const plotConfig = writable({
    total_time_us: 0,
    overview_window_us: 0,
    zoom1_window_us: 0,
    zoom2_window_us: 0,
    zoom1_position: 50,
    zoom2_position: 50,
    selectedChannelData: null,
    selectedTrcData: null,
    selectedSegmentData: null
});

// Cache store for performance optimization
export const lastChunkCache = writable({ 
    key: null, 
    data: null 
});

// Time steps store
export const timeSteps = writable([]);

// Derived stores for computed values
export const isDataReadyForPlot = derived(
    [selectedChannel, selectedTrc, selectedSegment, isDataLoaded],
    ([$selectedChannel, $selectedTrc, $selectedSegment, $isDataLoaded]) => 
        $isDataLoaded && $selectedChannel && $selectedTrc && $selectedSegment
);

export const currentDataUrl = derived(
    [dataUrl],
    ([$dataUrl]) => $dataUrl
);

// UI control stores
export const showCopyLink = writable(false);
export const showPlotAnotherButton = writable(false);

// Helper functions to reset state
export function resetAppState() {
    zarrGroup.set(null);
    rawStore.set(null);
    overviewStore.set(null);
    dataUrl.set('');
    isDataLoaded.set(false);
    isLoading.set(false);
    error.set(null);
    currentView.set('input');
    selectedChannel.set('');
    selectedTrc.set('');
    selectedSegment.set('');
    plotConfig.set({
        total_time_us: 0,
        overview_window_us: 0,
        zoom1_window_us: 0,
        zoom2_window_us: 0,
        zoom1_position: 50,
        zoom2_position: 50,
        selectedChannelData: null,
        selectedTrcData: null,
        selectedSegmentData: null
    });
    lastChunkCache.set({ key: null, data: null });
    timeSteps.set([]);
    showCopyLink.set(false);
    showPlotAnotherButton.set(false);
}

export function setLoadingState(loading) {
    isLoading.set(loading);
    if (loading) {
        error.set(null);
    }
}

export function setError(errorMessage) {
    error.set(errorMessage);
    isLoading.set(false);
}
