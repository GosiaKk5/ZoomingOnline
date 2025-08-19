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
} from './selectionStore.ts';

// Plot stores (flattened)
export * from './plotConfig';
export * from './zoomState';
export * from './derivedStores';
export { plotActions } from './actions';
import { ZoomService } from '../services/zoomService.ts';
export { ZoomService };
export { ZoomUrlService } from '../services/zoomUrlService.ts';

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