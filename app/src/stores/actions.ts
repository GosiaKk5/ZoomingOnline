/**
 * Plot Action Creators
 * 
 * Action creators that coordinate between stores and services.
 * These provide a clean API for components to interact with plot state
 * while handling business logic through services.
 */

import { get } from "svelte/store";
import { plotConfig, resetPlotConfig, updatePlotConfig, type PlotConfig } from "./plotConfig";
import { zoomPosition, zoomWidth, setZoomState, resetZoomState, setDefaultZoomPosition } from "./zoomState";
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

	// Initialize default zoom position when plot data is available
	initializeDefaultZoom(): void {
		const config = get(plotConfig);
		if (config.no_of_samples) {
			setDefaultZoomPosition(config.no_of_samples);
		}
	},

	// Zoom actions with URL synchronization
	updateZoomPosition(newPosition: number): void {
		const config = get(plotConfig);
		const totalSamples = config.no_of_samples || 1000;
		const validPosition = ZoomService.validatePosition(newPosition, totalSamples);
		const currentWidth = get(zoomWidth);
    
		// Update the store
		zoomPosition.set(validPosition);
    
		// Convert width to zoomLevelIndex for URL - use proper conversion
		let zoomLevelIndex: number | null = null;
		if (currentWidth !== null && config.total_time_s && config.horiz_interval) {
			zoomLevelIndex = ZoomService.findZoomLevelIndex(
				currentWidth, 
				config.total_time_s, 
				config.horiz_interval
			);
		}
		UrlService.updateZoomParams(validPosition, zoomLevelIndex);
    
		console.log('🎯 Zoom position updated to sample:', validPosition, 'zoomLevelIndex:', zoomLevelIndex);
	},

	updateZoomWidth(newWidth: number | null): void {
		const validWidth = ZoomService.validateWidth(newWidth);
		const currentPosition = get(zoomPosition);
		const config = get(plotConfig);
    
		// Update the store
		zoomWidth.set(validWidth);
    
		// Convert width to zoomLevelIndex for URL - use proper conversion
		let zoomLevelIndex: number | null = null;
		if (validWidth !== null && config.total_time_s && config.horiz_interval) {
			zoomLevelIndex = ZoomService.findZoomLevelIndex(
				validWidth, 
				config.total_time_s, 
				config.horiz_interval
			);
		}
		UrlService.updateZoomParams(currentPosition, zoomLevelIndex);
    
		console.log('🔍 Zoom width updated:', validWidth, 'zoomLevelIndex:', zoomLevelIndex);
	},

	setZoomState(position: number, width: number | null): void {
		const config = get(plotConfig);
		const totalSamples = config.no_of_samples || 1000;
		const validPosition = ZoomService.validatePosition(position, totalSamples);
		const validWidth = ZoomService.validateWidth(width);
    
		// Update the stores
		setZoomState(validPosition, validWidth);
    
		// Convert width to zoomLevelIndex for URL - use proper conversion
		let zoomLevelIndex: number | null = null;
		if (validWidth !== null && config.total_time_s && config.horiz_interval) {
			zoomLevelIndex = ZoomService.findZoomLevelIndex(
				validWidth, 
				config.total_time_s, 
				config.horiz_interval
			);
		}
		UrlService.updateZoomParams(validPosition, zoomLevelIndex);
    
		console.log('🎯 Zoom state set to sample:', { position: validPosition, width: validWidth, zoomLevelIndex });
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
			const maxZoomLevelIndex = ZoomService.getMaxZoomLevelIndex(config); // Use proper max calculation
			
			const zoomSample = zoomParams.zoomSample || 0;
			const zoomLevelIndex = zoomParams.zoomLevelIndex;
			
			const validation = UrlService.validateZoomParams(
				zoomSample, 
				zoomLevelIndex, 
				totalSamples, 
				maxZoomLevelIndex
			);
			
			if (validation.isValid) {
				// Convert zoomLevelIndex back to width - use proper conversion
				let width: number | null = null;
				if (validation.levelIndex !== null && config.total_time_s && config.horiz_interval) {
					width = ZoomService.convertZoomLevelIndexToWidth(
						validation.levelIndex,
						config.total_time_s,
						config.horiz_interval
					);
				}
				setZoomState(validation.sample, width);
				console.log('🔄 Zoom state restored from URL:', { sample: validation.sample, width, zoomLevelIndex: validation.levelIndex });
				return true;
			}
		}
    
		// Use defaults (user came from selection route)
		if (zoomParams.useDefaults) {
			// Calculate default position as middle of the plot based on data
			const totalSamples = config.no_of_samples || 1000;
			const defaultSample = Math.floor(totalSamples / 2);
			const defaultWidth = null; // or some default width
			setZoomState(defaultSample, defaultWidth);
			console.log(`🔄 Zoom state set to defaults: sample ${defaultSample} (middle of ${totalSamples} samples)`);
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