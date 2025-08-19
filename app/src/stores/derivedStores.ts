/**
 * Plot Derived Stores
 * 
 * Computed values derived from plot configuration and zoom state.
 * These are reactive computed properties based on the core stores.
 */

import { derived, type Readable } from "svelte/store";
import { plotConfig } from "./plotConfig";
import { zoomPosition, zoomWidth } from "./zoomState";

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
	([$plotConfig]) => {
		if (!$plotConfig) return false;
		const data = $plotConfig.overviewData;
		return Array.isArray(data) && data.length > 0;
	}
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