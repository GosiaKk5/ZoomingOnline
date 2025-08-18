/**
 * ZoomUrlService - URL synchronization for zoom state
 * 
 * This service handles the synchronization between zoom state
 * and URL parameters, providing a clean API for URL management.
 */

import type { PlotConfig } from "../stores/plotStore";
import { ZoomService } from "./zoomService";
import { 
  updateUrlWithZoomParams, 
  clearZoomParamsFromUrl, 
  getZoomParamsFromUrl,
  validateZoomParams 
} from "../utils/urlManager";

export class ZoomUrlService {
  /**
   * Update URL parameters based on current zoom state
   */
  static updateUrlFromState(
    position: number,
    width: number | null,
    config: PlotConfig
  ): void {
    if (!config?.no_of_samples || !config?.horiz_interval) {
      return;
    }
    
    const sampleNumber = ZoomService.convertPositionToSample(
      position, 
      config.no_of_samples
    );
    
    let zoomLevelIndex: number | null = null;
    if (width !== null && config.total_time_s) {
      zoomLevelIndex = ZoomService.findZoomLevelIndex(
        width, 
        config.total_time_s, 
        config.horiz_interval
      );
    }
    
    updateUrlWithZoomParams(sampleNumber, zoomLevelIndex);
  }

  /**
   * Restore zoom state from URL parameters
   */
  static restoreFromUrl(config: PlotConfig): {
    position: number;
    width: number | null;
    restored: boolean;
  } {
    const { zoomSample, zoomLevelIndex } = getZoomParamsFromUrl();
    
    if (zoomSample === undefined) {
      return { position: 0.5, width: null, restored: false };
    }
    
    if (!config?.no_of_samples || !config?.horiz_interval) {
      return { position: 0.5, width: null, restored: false };
    }
    
    const { sample, levelIndex } = validateZoomParams(
      zoomSample, 
      zoomLevelIndex || null, 
      config.no_of_samples, 
      ZoomService.getMaxZoomLevelIndex(config)
    );
    
    // Convert sample number back to position
    const position = ZoomService.convertSampleToPosition(sample, config.no_of_samples);
    
    // Convert zoom level index back to width fraction
    let width: number | null = null;
    if (levelIndex !== null && config.total_time_s && config.horiz_interval) {
      width = ZoomService.convertZoomLevelIndexToWidth(
        levelIndex,
        config.total_time_s,
        config.horiz_interval
      );
    }
    
    return { position, width, restored: true };
  }

  /**
   * Clear zoom parameters from URL
   */
  static clearFromUrl(): void {
    clearZoomParamsFromUrl();
  }

  /**
   * Check if URL contains zoom parameters
   */
  static hasZoomParamsInUrl(): boolean {
    const { zoomSample, zoomLevelIndex } = getZoomParamsFromUrl();
    return zoomSample !== undefined || zoomLevelIndex !== undefined;
  }
}