/**
 * Plot configuration and visualization store
 * Manages plot settings, zoom state, and visualization configuration
 */
import { writable, derived, type Writable, type Readable } from "svelte/store";
import { 
  updateUrlWithZoomParams, 
  clearZoomParamsFromUrl, 
  getZoomParamsFromUrl,
  validateZoomParams 
} from "../utils/urlManager";

export interface PlotConfig {
  total_time_s: number;
  selectedChannelData: any | null;
  selectedTrcData: any | null;
  selectedSegmentData: any | null;
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

// Plot configuration store
export const plotConfig: Writable<PlotConfig> = writable({
  total_time_s: 0,
  selectedChannelData: null,
  selectedTrcData: null,
  selectedSegmentData: null,
});

// Zoom rectangle state stores
export const zoomPosition: Writable<number> = writable(0.5);
export const zoomWidth: Writable<number | null> = writable(null);

// Derived plot states for better component integration
export const isPlotConfigReady: Readable<boolean> = derived(
  [plotConfig],
  ([$plotConfig]) => Boolean($plotConfig && $plotConfig.total_time_s > 0)
);

export const zoomState: Readable<{ position: number; width: number | null }> = derived(
  [zoomPosition, zoomWidth],
  ([$zoomPosition, $zoomWidth]) => ({
    position: $zoomPosition,
    width: $zoomWidth
  })
);

export const hasPlotData: Readable<boolean> = derived(
  [plotConfig],
  ([$plotConfig]) => Boolean(
    $plotConfig &&
    $plotConfig.selectedChannelData &&
    $plotConfig.selectedTrcData &&
    $plotConfig.selectedSegmentData
  )
);

export const plotSummary: Readable<{
  isReady: boolean;
  hasData: boolean;
  totalTime: number;
  zoomPosition: number;
  zoomWidth: number | null;
}> = derived(
  [isPlotConfigReady, hasPlotData, plotConfig, zoomPosition, zoomWidth],
  ([$isPlotConfigReady, $hasPlotData, $plotConfig, $zoomPosition, $zoomWidth]) => ({
    isReady: $isPlotConfigReady,
    hasData: $hasPlotData,
    totalTime: $plotConfig.total_time_s,
    zoomPosition: $zoomPosition,
    zoomWidth: $zoomWidth
  })
);

// Helper functions for plot management
export function resetPlotState(): void {
  plotConfig.set({
    total_time_s: 0,
    selectedChannelData: null,
    selectedTrcData: null,
    selectedSegmentData: null,
  });
  zoomPosition.set(0.5);
  zoomWidth.set(null);
}

export function updatePlotConfig(config: Partial<PlotConfig>): void {
  plotConfig.update(current => ({ ...current, ...config }));
}

export function setZoomState(position: number, width: number | null = null): void {
  zoomPosition.set(position);
  zoomWidth.set(width);
  // Update URL with new zoom parameters
  updateUrlWithZoomParams(position, width);
}

export function resetZoom(): void {
  zoomPosition.set(0.5);
  zoomWidth.set(null);
  // Clear zoom parameters from URL
  clearZoomParamsFromUrl();
}

/**
 * Restore zoom state from URL parameters (called on app initialization)
 */
export function restoreZoomStateFromUrl(): boolean {
  const { zoomPosition: urlPosition, zoomWidth: urlWidth } = getZoomParamsFromUrl();
  
  if (urlPosition !== undefined) {
    const { position, width } = validateZoomParams(urlPosition, urlWidth || null);
    
    // Set zoom state without triggering URL update to avoid infinite loop
    zoomPosition.set(position);
    zoomWidth.set(width);
    
    console.log('🔄 Restored zoom state from URL:', { position, width });
    return true;
  }
  
  return false;
}

/**
 * Update zoom position and sync with URL (for drag operations)
 */
export function updateZoomPosition(newPosition: number): void {
  const currentWidth = getCurrentZoomWidth();
  const { position } = validateZoomParams(newPosition, currentWidth);
  
  zoomPosition.set(position);
  updateUrlWithZoomParams(position, currentWidth);
}

/**
 * Update zoom width and sync with URL (for zoom level changes)
 */
export function updateZoomWidth(newWidth: number | null): void {
  const currentPosition = getCurrentZoomPosition();
  const { position, width } = validateZoomParams(currentPosition, newWidth);
  
  zoomWidth.set(width);
  updateUrlWithZoomParams(position, width);
}

/**
 * Get current zoom position value (for internal use)
 */
function getCurrentZoomPosition(): number {
  let currentPosition = 0.5;
  zoomPosition.subscribe(val => currentPosition = val)();
  return currentPosition;
}

/**
 * Get current zoom width value (for internal use)
 */
function getCurrentZoomWidth(): number | null {
  let currentWidth: number | null = null;
  zoomWidth.subscribe(val => currentWidth = val)();
  return currentWidth;
}

// Utility functions for zoom level configuration
export function getDefaultZoomLevelIndex(totalLevels: number): number {
  return Math.min(3, totalLevels - 1);
}

export function getDefaultZoomLevel(zoomLevelsWithLabels: Array<{ value: number; label: string }>): number | undefined {
  if (zoomLevelsWithLabels.length === 0) return undefined;
  const defaultIndex = getDefaultZoomLevelIndex(zoomLevelsWithLabels.length);
  return zoomLevelsWithLabels[zoomLevelsWithLabels.length - 1 - defaultIndex]?.value;
}

export function calculateZoomBounds(position: number, width: number | null, totalTime: number): {
  startTime: number;
  endTime: number;
} {
  if (!width) {
    return { startTime: 0, endTime: totalTime };
  }
  
  const halfWidth = width / 2;
  const startTime = Math.max(0, (position - halfWidth) * totalTime);
  const endTime = Math.min(totalTime, (position + halfWidth) * totalTime);
  
  return { startTime, endTime };
}