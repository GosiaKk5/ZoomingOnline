/**
 * Plot Action Creators
 * 
 * Action creators that coordinate between stores and services.
 * These provide a clean API for components to interact with plot state
 * while handling business logic through services.
 */

import { get } from "svelte/store";
import { plotConfig, resetPlotConfig, updatePlotConfig, type PlotConfig } from "./plotConfig";
import { zoomPosition, zoomWidth, setZoomState, resetZoomState } from "./zoomState";
import { ZoomService } from "../services/zoomService";
import { ZoomUrlService } from "../services/zoomUrlService";

export const plotActions = {
	// Plot configuration actions
	resetPlot(): void {
		resetPlotConfig();
		resetZoomState();
		ZoomUrlService.clearFromUrl();
		console.log('🔄 Plot state reset');
	},

	updateConfig(config: Partial<PlotConfig>): void {
		updatePlotConfig(config);
		console.log('🔧 Plot config updated:', config);
	},

	// Zoom actions with URL synchronization
	updateZoomPosition(newPosition: number): void {
		const validPosition = ZoomService.validatePosition(newPosition);
		const currentWidth = get(zoomWidth);
		const config = get(plotConfig);
    
		// Update the store
		zoomPosition.set(validPosition);
    
		// Sync with URL
		ZoomUrlService.updateUrlFromState(validPosition, currentWidth, config);
    
		console.log('🎯 Zoom position updated:', validPosition);
	},

	updateZoomWidth(newWidth: number | null): void {
		const validWidth = ZoomService.validateWidth(newWidth);
		const currentPosition = get(zoomPosition);
		const config = get(plotConfig);
    
		// Update the store
		zoomWidth.set(validWidth);
    
		// Sync with URL
		ZoomUrlService.updateUrlFromState(currentPosition, validWidth, config);
    
		console.log('🔍 Zoom width updated:', validWidth);
	},

	setZoomState(position: number, width: number | null): void {
		const validPosition = ZoomService.validatePosition(position);
		const validWidth = ZoomService.validateWidth(width);
		const config = get(plotConfig);
    
		// Update the stores
		setZoomState(validPosition, validWidth);
    
		// Sync with URL
		ZoomUrlService.updateUrlFromState(validPosition, validWidth, config);
    
		console.log('🎯 Zoom state set:', { position: validPosition, width: validWidth });
	},

	resetZoom(): void {
		resetZoomState();
		ZoomUrlService.clearFromUrl();
		console.log('↩️ Zoom state reset');
	},

	// URL restoration
	restoreZoomFromUrl(): boolean {
		const config = get(plotConfig);
		const result = ZoomUrlService.restoreFromUrl(config);
    
		if (result.restored) {
			// Set zoom state without triggering URL update to avoid infinite loop
			setZoomState(result.position, result.width);
			console.log('🔄 Zoom state restored from URL:', result);
		}
    
		return result.restored;
	},

	// Utility actions
	calculateZoomBounds(): { startTime: number; endTime: number } {
		const position = get(zoomPosition);
		const width = get(zoomWidth);
		const config = get(plotConfig);
    
		return ZoomService.calculateZoomBounds(position, width, config.total_time_s);
	},

	getDefaultZoomLevel(zoomLevelsWithLabels: Array<{ value: number; label: string }>): number | undefined {
		return ZoomService.getDefaultZoomLevel(zoomLevelsWithLabels);
	},

	convertZoomLevelToWidth(zoomLevel: number): number | null {
		const config = get(plotConfig);
		if (!config.total_time_s) return null;
		return ZoomService.timespanToWidth(zoomLevel, config.total_time_s);
	},

	// Combined reset for complete cleanup
	resetPlotState(): void {
		this.resetPlot();
		console.log('🔄 Complete plot state reset');
	}
};