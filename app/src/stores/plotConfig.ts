/**
 * Plot Configuration Store
 * 
 * Core plot configuration and data state management.
 * This store focuses purely on plot configuration data.
 */

import { writable, type Writable } from "svelte/store";
import type { PlotConfig } from "../types/stores";

// Re-export type for backward compatibility
export type { PlotConfig };

// Plot configuration store with proper typing
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