/**
 * Centralized exports for all stores
 * This file makes it easy to import stores from a single location
 */

// Application Configuration Store
export {
  appConfig,
  updateConfig,
  resetConfig,
  getDefaultConfig,
  type AppConfig
} from './appConfigStore.ts';

// Data Management Store
export {
  zarrGroup,
  rawStore,
  overviewStore,
  dataUrl,
  isDataLoaded,
  dataVersion,
  lastChunkCache,
  currentDataUrl,
  isDataReady,
  hasValidData,
  resetDataState,
  setDataLoaded,
  updateCache,
  clearCache,
  type CacheEntry
} from './dataStore.ts';

// UI State Store
export {
  isLoading,
  error,
  showCopyLink,
  currentView,
  hasError,
  canInteract,
  uiState,
  setLoadingState,
  setError,
  clearError,
  resetUIState,
  toggleCopyLink,
  showCopyLinkTemporarily
} from './uiStore.ts';

// Selection State Store
export {
  selectedChannel,
  selectedTrc,
  selectedSegment,
  isDataReadyForPlot,
  selectionSummary,
  hasValidSelections,
  selectionState,
  resetSelections,
  setSelections,
  updateChannel,
  updateTrc,
  updateSegment,
  getSelectionValues
} from './selectionStore.ts';

// Plot Configuration Store
export {
  plotConfig,
  zoomPosition,
  zoomWidth,
  isPlotConfigReady,
  zoomState,
  hasPlotData,
  plotSummary,
  resetPlotState,
  updatePlotConfig,
  setZoomState,
  resetZoom,
  getDefaultZoomLevelIndex,
  getDefaultZoomLevel,
  calculateZoomBounds,
  type PlotConfig
} from './plotStore.ts';