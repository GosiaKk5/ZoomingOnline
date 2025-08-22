/**
 * ZoomService - Pure business logic for zoom calculations
 *
 * This service handles all zoom-related calculations without any store dependencies.
 * It provides pure functions for converting between different zoom representations.
 */

import { generateZoomLevelsWithLabels } from "../utils/zoomLevels";
import type { PlotConfig } from "../types/stores";

export class ZoomService {
  /**
   * Convert normalized position (0-1) to sample number
   */
  static convertPositionToSample(
    position: number,
    totalSamples: number,
  ): number {
    return Math.round(position * (totalSamples - 1));
  }

  /**
   * Convert sample number to normalized position (0-1)
   */
  static convertSampleToPosition(sample: number, totalSamples: number): number {
    if (totalSamples <= 1) return 0;
    return sample / (totalSamples - 1);
  }

  /**
   * Find the closest zoom level index for a given width fraction
   */
  static findZoomLevelIndex(
    currentWidth: number,
    totalTime: number,
    horizInterval: number,
  ): number | null {
    const zoomLevels = generateZoomLevelsWithLabels(horizInterval, totalTime);
    if (zoomLevels.length === 0 || !zoomLevels[0]) return null;

    const targetTimeSpan = currentWidth * totalTime;
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

    return closestIndex;
  }

  /**
   * Convert zoom level index back to width fraction
   */
  static convertZoomLevelIndexToWidth(
    levelIndex: number,
    totalTime: number,
    horizInterval: number,
  ): number | null {
    const zoomLevels = generateZoomLevelsWithLabels(horizInterval, totalTime);
    if (levelIndex < 0 || levelIndex >= zoomLevels.length) return null;

    const level = zoomLevels[levelIndex];
    if (!level) return null;

    return level.value / totalTime;
  }

  /**
   * Calculate zoom bounds in time units
   */
  static calculateZoomBounds(
    position: number,
    width: number | null,
    totalTime: number,
  ): { startTime: number; endTime: number } {
    if (width === null) {
      return { startTime: 0, endTime: totalTime };
    }

    const halfWidth = width / 2;
    const centerTime = position * totalTime;

    return {
      startTime: Math.max(0, centerTime - halfWidth * totalTime),
      endTime: Math.min(totalTime, centerTime + halfWidth * totalTime),
    };
  }

  /**
   * Get default zoom level index (around 60% into the available levels)
   */
  static getDefaultZoomLevelIndex(totalLevels: number): number {
    if (totalLevels <= 1) return 0;
    return Math.min(3, totalLevels - 1);
  }

  /**
   * Get default zoom level value
   */
  static getDefaultZoomLevel(
    zoomLevelsWithLabels: Array<{ value: number; label: string }>,
  ): number | undefined {
    if (zoomLevelsWithLabels.length === 0) return undefined;
    const defaultIndex = ZoomService.getDefaultZoomLevelIndex(
      zoomLevelsWithLabels.length,
    );
    return zoomLevelsWithLabels[zoomLevelsWithLabels.length - 1 - defaultIndex]
      ?.value;
  }

  /**
   * Get maximum zoom level index for validation
   */
  static getMaxZoomLevelIndex(config: PlotConfig): number {
    if (!config.horiz_interval || !config.total_time_s) return 0;
    const zoomLevels = generateZoomLevelsWithLabels(
      config.horiz_interval,
      config.total_time_s,
    );
    return Math.max(0, zoomLevels.length - 1);
  }

  /**
   * Validate and clamp zoom position
   */
  /**
   * Validate and clamp zoom position to valid sample number
   */
  static validatePosition(
    position: number,
    totalSamples: number = 1000,
  ): number {
    return Math.max(0, Math.min(totalSamples - 1, Math.floor(position)));
  }

  /**
   * Validate and clamp zoom width
   */
  static validateWidth(width: number | null): number | null {
    if (width === null) return null;
    return Math.max(0, Math.min(1, width));
  }

  /**
   * Convert an absolute timespan (seconds) to normalized width (0..1)
   */
  static timespanToWidth(timespan: number, totalTime: number): number {
    if (!totalTime || timespan <= 0) return 0;
    return Math.min(1, timespan / totalTime);
  }
}
