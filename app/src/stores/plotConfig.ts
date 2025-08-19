/**
 * Plot Configuration Store
 * 
 * Core plot configuration and data state management.
 * This store focuses purely on plot configuration data.
 */

import { writable, type Writable } from "svelte/store";

export interface PlotConfig {
	total_time_s: number;
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
});

// Basic plot config operations
export function resetPlotConfig(): void {
	plotConfig.set({
		total_time_s: 0,
	});
}

export function updatePlotConfig(config: Partial<PlotConfig>): void {
	plotConfig.update(current => ({ ...current, ...config }));
}