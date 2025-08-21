/**
 * Centralized exports for all stores
 * This file makes it easy to import stores from a single location
 */

// Export store types
export type {
  ZarrGroup,
  RawDataStore,
  OverviewStore,
  OverviewDataPoint,
  CacheEntry,
  UIState,
  CurrentView,
  SelectionState,
  SelectionSummary,
  PlotConfig,
  ZoomLevel,
  ZoomState,
  AppConfig,
  DerivedPlotData,
  PlotActions,
  StoreError
} from '../types/stores';

// Application Configuration Store
export {
  appConfig,
  updateConfig,
  resetConfig,
  getDefaultConfig
} from './appConfigStore';

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
  clearCache
} from './dataStore';

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
} from './uiStore';

// Selection State Store
export {
  selectedChannel,
  selectedTrc,
  selectedSegment,
  selectedChannelIndex,
  selectedTrcIndex,
  selectedSegmentIndex,
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
} from './selectionStore';

// Plot stores (flattened)
export * from './plotConfig';
export * from './zoomState';
export * from './derivedStores';
export { plotActions } from './actions';
import { ZoomService } from '../services/zoomService';
export { ZoomService };
export { UrlService } from '../services/urlService';

// Convenience re-exports for components expecting named functions from stores
export const getDefaultZoomLevelIndex = (totalLevels: number) =>
  ZoomService.getDefaultZoomLevelIndex(totalLevels);
export const getDefaultZoomLevel = (
  zoomLevelsWithLabels: Array<{ value: number; label: string }>
) => ZoomService.getDefaultZoomLevel(zoomLevelsWithLabels);
export const calculateZoomBounds = (
  position: number,
  width: number | null,
  totalTime: number
) => ZoomService.calculateZoomBounds(position, width, totalTime);