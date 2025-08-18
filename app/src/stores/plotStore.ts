/**
 * Plot configuration and visualization store
 * Manages plot settings, zoom state, and visualization configuration
 */
import { writable, derived, type Writable, type Readable } from "svelte/store";

export interface PlotConfig {
  total_time_s: number;
  selectedChannelData: any | null;
  selectedTrcData: any | null;
  selectedSegmentData: any | null;
  margin?: { top: number; right: number; bottom: number; left: number };
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
}

export function resetZoom(): void {
  zoomPosition.set(0.5);
  zoomWidth.set(null);
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