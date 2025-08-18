/**
 * Plot Configuration Store
 * 
 * Core plot configuration and data state management.
 * This store focuses purely on plot configuration data.
 */

import { writable, type Writable } from "svelte/store";

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

// Basic plot config operations
export function resetPlotConfig(): void {
  plotConfig.set({
    total_time_s: 0,
    selectedChannelData: null,
    selectedTrcData: null,
    selectedSegmentData: null,
  });
}

export function updatePlotConfig(config: Partial<PlotConfig>): void {
  plotConfig.update(current => ({ ...current, ...config }));
}