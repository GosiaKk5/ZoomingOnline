/**
 * Consolidated Application State Store
 * 
 * Single source of truth for all app state, replacing multiple fragmented stores
 * with a clean, unified state structure.
 */

import { writable, derived, type Writable } from "svelte/store";
import type { ZarrGroup, RawDataStore, OverviewStore, PlotConfig, CurrentView } from "../types/stores";

// Core application state interface
interface AppState {
  // Data state - consolidated from dataStore
  data: {
    zarrGroup: ZarrGroup | null;
    rawStore: RawDataStore | null; 
    overviewStore: OverviewStore | null;
    url: string;
    isLoaded: boolean;
    version: number;
  };
  
  // Selection state - simplified to use indices directly
  selection: {
    channelIndex: number;
    trcIndex: number;
    segmentIndex: number;
  };
  
  // Plot state - consolidated from plotConfig and zoomState
  plot: {
    config: PlotConfig | null;
    zoomPosition: number; // 0-1 range representing position within the data
    zoomWidth: number | null; // Width of zoom window as fraction of total data
    zoomLevel: number | null; // Current zoom level (time span in seconds)
  };
  
  // UI state - consolidated from uiStore
  ui: {
    isLoading: boolean;
    error: string | null;
    showCopyLink: boolean;
    currentView: CurrentView;
  };
}

// Default state
const defaultState: AppState = {
  data: {
    zarrGroup: null,
    rawStore: null,
    overviewStore: null,
    url: "",
    isLoaded: false,
    version: 0,
  },
  selection: {
    channelIndex: 0,
    trcIndex: 0, 
    segmentIndex: 0,
  },
  plot: {
    config: null,
    zoomPosition: 0,
    zoomWidth: null,
    zoomLevel: null,
  },
  ui: {
    isLoading: false,
    error: null,
    showCopyLink: false,
    currentView: 'home',
  },
};

// Main state store
export const appState: Writable<AppState> = writable(defaultState);

// Selector functions for clean component access
export const dataState = derived(appState, $appState => $appState.data);
export const selectionState = derived(appState, $appState => $appState.selection);
export const plotState = derived(appState, $appState => $appState.plot);
export const uiState = derived(appState, $appState => $appState.ui);

// Key derived values (only the truly necessary ones)
export const isDataReady = derived(
  dataState,
  $dataState => $dataState.isLoaded && $dataState.rawStore !== null && $dataState.overviewStore !== null
);

export const isDataReadyForPlot = derived(
  [dataState, selectionState],
  ([$dataState, $selectionState]) =>
    $dataState.isLoaded && 
    $dataState.rawStore !== null &&
    $selectionState.channelIndex >= 0 &&
    $selectionState.trcIndex >= 0 &&
    $selectionState.segmentIndex >= 0
);

export const canInteract = derived(
  uiState,
  $uiState => !$uiState.isLoading && !$uiState.error
);

// Selector options computed directly when needed (no caching)
export const selectorOptions = derived(
  dataState,
  $dataState => {
    if (!$dataState.rawStore?.shape) {
      return { channels: [], trcFiles: [], segments: [] };
    }
    
    const [channelCount, trcCount, segmentCount] = $dataState.rawStore.shape;
    return {
      channels: Array.from({ length: channelCount || 0 }, (_, i) => `${i + 1}`),
      trcFiles: Array.from({ length: trcCount || 0 }, (_, i) => `${i + 1}`),
      segments: Array.from({ length: segmentCount || 0 }, (_, i) => `${i + 1}`)
    };
  }
);

// Action creators for clean state updates
export const actions = {
  // Data actions
  setData(data: Partial<AppState['data']>) {
    appState.update(state => ({
      ...state,
      data: { ...state.data, ...data }
    }));
  },
  
  resetData() {
    appState.update(state => ({
      ...state,
      data: defaultState.data
    }));
  },
  
  // Selection actions - work with indices directly
  setSelection(selection: Partial<AppState['selection']>) {
    appState.update(state => ({
      ...state,
      selection: { ...state.selection, ...selection }
    }));
  },

  // Alias for setSelection to maintain compatibility
  updateSelection(selection: Partial<AppState['selection']>) {
    this.setSelection(selection);
  },
  
  setSelectionFromValues(channel: string, trc: string, segment: string) {
    const channelIndex = parseInt(channel) - 1;
    const trcIndex = parseInt(trc) - 1; 
    const segmentIndex = parseInt(segment) - 1;
    
    appState.update(state => ({
      ...state,
      selection: { 
        channelIndex: Math.max(0, channelIndex),
        trcIndex: Math.max(0, trcIndex),
        segmentIndex: Math.max(0, segmentIndex)
      }
    }));
  },
  
  // Plot actions
  setPlot(plot: Partial<AppState['plot']>) {
    appState.update(state => ({
      ...state,
      plot: { ...state.plot, ...plot }
    }));
  },
  
  resetZoom() {
    appState.update(state => ({
      ...state,
      plot: { 
        ...state.plot,
        zoomPosition: 0,
        zoomWidth: null,
        zoomLevel: null
      }
    }));
  },
  
  // UI actions
  setUI(ui: Partial<AppState['ui']>) {
    appState.update(state => ({
      ...state,
      ui: { ...state.ui, ...ui }
    }));
  },
  
  setLoading(isLoading: boolean) {
    appState.update(state => ({
      ...state,
      ui: { 
        ...state.ui, 
        isLoading,
        error: isLoading ? null : state.ui.error // Clear errors when loading
      }
    }));
  },
  
  setError(error: string | null) {
    appState.update(state => ({
      ...state,
      ui: { 
        ...state.ui, 
        error,
        isLoading: false // Stop loading on error
      }
    }));
  },
  
  // Complete reset
  reset() {
    appState.set(defaultState);
  }
};

// Backward compatibility exports for gradual migration
export const selectedChannelIndex = derived(selectionState, $selectionState => $selectionState.channelIndex);
export const selectedTrcIndex = derived(selectionState, $selectionState => $selectionState.trcIndex);
export const selectedSegmentIndex = derived(selectionState, $selectionState => $selectionState.segmentIndex);

export const rawStore = derived(dataState, $dataState => $dataState.rawStore);
export const overviewStore = derived(dataState, $dataState => $dataState.overviewStore);
export const zarrGroup = derived(dataState, $dataState => $dataState.zarrGroup);
export const isDataLoaded = derived(dataState, $dataState => $dataState.isLoaded);
export const dataUrl = derived(dataState, $dataState => $dataState.url);

export const isLoading = derived(uiState, $uiState => $uiState.isLoading);
export const error = derived(uiState, $uiState => $uiState.error);
export const showCopyLink = derived(uiState, $uiState => $uiState.showCopyLink);

export const zoomPosition = derived(plotState, $plotState => $plotState.zoomPosition);
export const zoomWidth = derived(plotState, $plotState => $plotState.zoomWidth);
export const zoomLevel = derived(plotState, $plotState => $plotState.zoomLevel);
export const plotConfig = derived(plotState, $plotState => $plotState.config);