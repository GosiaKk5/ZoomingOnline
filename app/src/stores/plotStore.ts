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
import { generateZoomLevelsWithLabels } from "../utils/zoomLevels";

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
  // Convert to sample/index and update URL
  updateZoomUrlFromState();
}

export function resetZoom(): void {
  zoomPosition.set(0.5);
  zoomWidth.set(null);
  // Clear zoom parameters from URL
  clearZoomParamsFromUrl();
}

/**
 * Convert current zoom state to sample number and level index, then update URL
 */
function updateZoomUrlFromState(): void {
  // Get current plot config to access sample and time information
  let currentConfig: PlotConfig = {
    total_time_s: 0,
    selectedChannelData: null,
    selectedTrcData: null,
    selectedSegmentData: null,
  };
  const unsubscribe = plotConfig.subscribe(config => currentConfig = config);
  unsubscribe();
  
  if (!currentConfig || !currentConfig.no_of_samples || !currentConfig.horiz_interval) {
    return;
  }
  
  let currentPosition = 0.5;
  let currentWidth: number | null = null;
  const unsubscribePos = zoomPosition.subscribe(val => currentPosition = val);
  const unsubscribeWidth = zoomWidth.subscribe(val => currentWidth = val);
  unsubscribePos();
  unsubscribeWidth();
  
  // Convert position (0-1) to sample number
  const sampleNumber = Math.round(currentPosition * (currentConfig.no_of_samples - 1));
  
  // Convert width to zoom level index (if width is set)
  let zoomLevelIndex: number | null = null;
  if (currentWidth !== null && currentConfig.total_time_s) {
    const zoomLevels = generateZoomLevelsWithLabels(
      currentConfig.horiz_interval, 
      currentConfig.total_time_s
    );
    if (zoomLevels.length > 0 && zoomLevels[0]) {
      const targetTimeSpan = currentWidth * currentConfig.total_time_s;
      // Find closest zoom level
      let closestIndex = 0;
      let minDiff = Math.abs(zoomLevels[0].value - targetTimeSpan);
      for (let i = 1; i < zoomLevels.length; i++) {
        const level = zoomLevels[i];
        if (level) {
          const diff = Math.abs(level.value - targetTimeSpan);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }
      }
      zoomLevelIndex = closestIndex;
    }
  }
  
  updateUrlWithZoomParams(sampleNumber, zoomLevelIndex);
}

/**
 * Restore zoom state from URL parameters (called on app initialization)
 */
export function restoreZoomStateFromUrl(): boolean {
  const { zoomSample, zoomLevelIndex } = getZoomParamsFromUrl();
  
  if (zoomSample !== undefined) {
    // Get current plot config to convert sample number back to position
    let currentConfig: PlotConfig = {
      total_time_s: 0,
      selectedChannelData: null,
      selectedTrcData: null,
      selectedSegmentData: null,
    };
    const unsubscribe = plotConfig.subscribe(config => currentConfig = config);
    unsubscribe();
    
    if (!currentConfig || !currentConfig.no_of_samples || !currentConfig.horiz_interval) {
      return false;
    }
    
    const { sample, levelIndex } = validateZoomParams(
      zoomSample, 
      zoomLevelIndex || null, 
      currentConfig.no_of_samples, 
      getMaxZoomLevelIndex(currentConfig)
    );
    
    // Convert sample number back to position (0-1)
    const position = sample / (currentConfig.no_of_samples - 1);
    
    // Convert zoom level index back to width fraction
    let width: number | null = null;
    if (levelIndex !== null && currentConfig.total_time_s) {
      const zoomLevels = generateZoomLevelsWithLabels(
        currentConfig.horiz_interval, 
        currentConfig.total_time_s
      );
      if (levelIndex < zoomLevels.length && zoomLevels[levelIndex]) {
        width = zoomLevels[levelIndex].value / currentConfig.total_time_s;
      }
    }
    
    // Set zoom state without triggering URL update to avoid infinite loop
    zoomPosition.set(position);
    zoomWidth.set(width);
    
    console.log('🔄 Restored zoom state from URL:', { sample, levelIndex, position, width });
    return true;
  }
  
  return false;
}

/**
 * Get maximum zoom level index for validation
 */
function getMaxZoomLevelIndex(config: PlotConfig): number {
  if (!config.horiz_interval || !config.total_time_s) return 0;
  const zoomLevels = generateZoomLevelsWithLabels(config.horiz_interval, config.total_time_s);
  return Math.max(0, zoomLevels.length - 1);
}

/**
 * Update zoom position and sync with URL (for drag operations)
 */
export function updateZoomPosition(newPosition: number): void {
  // Validate and clamp position
  const validPosition = Math.max(0, Math.min(1, newPosition));
  zoomPosition.set(validPosition);
  updateZoomUrlFromState();
}

/**
 * Update zoom width and sync with URL (for zoom level changes)
 */
export function updateZoomWidth(newWidth: number | null): void {
  // Validate and clamp width
  let validWidth = newWidth;
  if (newWidth !== null) {
    validWidth = Math.max(0, Math.min(1, newWidth));
  }
  zoomWidth.set(validWidth);
  updateZoomUrlFromState();
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