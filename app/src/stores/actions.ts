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
import { UrlService } from "../services/urlService";

export const plotActions = {
	// Plot configuration actions
	resetPlot(): void {
		resetPlotConfig();
		resetZoomState();
		UrlService.clearZoomParams();
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
    
		// Update the store
		zoomPosition.set(validPosition);
    
		// Convert width to zoomLevelIndex for URL (simplified - you may need to adjust this logic)
		const zoomLevelIndex = currentWidth !== null ? Math.round(currentWidth) : null;
		UrlService.updateZoomParams(validPosition, zoomLevelIndex);
    
		console.log('🎯 Zoom position updated:', validPosition);
	},

	updateZoomWidth(newWidth: number | null): void {
		const validWidth = ZoomService.validateWidth(newWidth);
		const currentPosition = get(zoomPosition);
    
		// Update the store
		zoomWidth.set(validWidth);
    
		// Convert width to zoomLevelIndex for URL (simplified - you may need to adjust this logic)
		const zoomLevelIndex = validWidth !== null ? Math.round(validWidth) : null;
		UrlService.updateZoomParams(currentPosition, zoomLevelIndex);
    
		console.log('🔍 Zoom width updated:', validWidth);
	},

	setZoomState(position: number, width: number | null): void {
		const validPosition = ZoomService.validatePosition(position);
		const validWidth = ZoomService.validateWidth(width);
    
		// Update the stores
		setZoomState(validPosition, validWidth);
    
		// Convert width to zoomLevelIndex for URL (simplified - you may need to adjust this logic)
		const zoomLevelIndex = validWidth !== null ? Math.round(validWidth) : null;
		UrlService.updateZoomParams(validPosition, zoomLevelIndex);
    
		console.log('🎯 Zoom state set:', { position: validPosition, width: validWidth });
	},

	resetZoom(): void {
		resetZoomState();
		UrlService.clearZoomParams();
		console.log('↩️ Zoom state reset');
	},

	// URL restoration - updated to use new UrlService
	restoreZoomFromUrl(): boolean {
		const config = get(plotConfig);
		const zoomParams = UrlService.initializePlotFromUrl();
    
		if (!zoomParams.useDefaults && (zoomParams.zoomSample !== null || zoomParams.zoomLevelIndex !== null)) {
			// We have zoom parameters in URL - validate and use them
			const totalSamples = config.no_of_samples || 1000; // Use no_of_samples from config
			const maxZoomLevelIndex = 10; // You may need to adjust this based on your zoom levels
			
			const zoomSample = zoomParams.zoomSample || 0;
			const zoomLevelIndex = zoomParams.zoomLevelIndex;
			
			const validation = UrlService.validateZoomParams(
				zoomSample, 
				zoomLevelIndex, 
				totalSamples, 
				maxZoomLevelIndex
			);
			
			if (validation.isValid) {
				// Convert zoomLevelIndex back to width (simplified - you may need to adjust this logic)
				const width = validation.levelIndex !== null ? validation.levelIndex : null;
				setZoomState(validation.sample, width);
				console.log('🔄 Zoom state restored from URL:', validation);
				return true;
			}
		}
    
		// Use defaults (user came from selection route)
		if (zoomParams.useDefaults) {
			// Set default zoom state - you can customize these values
			const defaultPosition = 0;
			const defaultWidth = null; // or some default width
			setZoomState(defaultPosition, defaultWidth);
			console.log('🔄 Zoom state set to defaults');
			return true;
		}
    
		return false;
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