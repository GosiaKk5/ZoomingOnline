export interface ZoomDomain {
  startTime: number;
  endTime: number;
}

export interface OverviewDataPoint {
  time_s: number;
  min_mv: number;
  max_mv: number;
}

/**
 * Service for chart data processing and zoom calculations
 * Contains pure functions that don't depend on component state
 */
export class ChartDataService {
  /**
   * Calculate the time domain for zoom based on zoom level and position
   * @param totalTime Total time span of the data
   * @param zoomLevel Time span of the zoom window in seconds
   * @param position Position within the data (0-1 range, where 0.5 is center)
   * @returns Start and end times for the zoom window
   */
  static calculateZoomDomain(
    totalTime: number,
    zoomLevel: number,
    position: number,
  ): ZoomDomain {
    const halfWindow = zoomLevel / 2;
    const centerTime = position * totalTime;

    let startTime = Math.max(0, centerTime - halfWindow);
    let endTime = Math.min(totalTime, centerTime + halfWindow);

    // Handle boundary conditions to maintain zoom window size
    if (endTime - startTime < zoomLevel) {
      if (startTime === 0) {
        endTime = Math.min(totalTime, zoomLevel);
      } else if (endTime === totalTime) {
        startTime = Math.max(0, totalTime - zoomLevel);
      }
    }

    return { startTime, endTime };
  }

  /**
   * Filter data points to a specific time range
   * @param data Array of data points with time_s property
   * @param startTime Start time for filtering
   * @param endTime End time for filtering
   * @returns Filtered array of data points
   */
  static filterDataByTimeRange(
    data: OverviewDataPoint[] | undefined,
    startTime: number,
    endTime: number,
  ): OverviewDataPoint[] {
    if (!data) return [];

    return data.filter((d) => d.time_s >= startTime && d.time_s <= endTime);
  }

  /**
   * Generate a formatted title for the chart based on zoom state
   * @param isZoomed Whether the chart is currently zoomed
   * @param zoomLevel The current zoom level in seconds
   * @returns Formatted chart title
   */
  static generateChartTitle(isZoomed: boolean, zoomLevel?: number): string {
    if (!isZoomed || zoomLevel === undefined) {
      return "Full Data View";
    }

    // Format zoom level appropriately
    if (zoomLevel >= 1) {
      return `Zoomed View (${zoomLevel.toFixed(1)} s span)`;
    } else if (zoomLevel >= 0.001) {
      return `Zoomed View (${(zoomLevel * 1000).toFixed(1)} ms span)`;
    } else {
      return `Zoomed View (${(zoomLevel * 1000000).toFixed(1)} µs span)`;
    }
  }

  /**
   * Validate zoom parameters
   * @param zoomLevel Zoom level in seconds
   * @param position Position (0-1 range)
   * @param totalTime Total time span
   * @returns Whether the parameters are valid
   */
  static validateZoomParameters(
    zoomLevel: number | null,
    position: number,
    totalTime: number,
  ): boolean {
    if (zoomLevel === null) return true; // No zoom is valid
    if (zoomLevel <= 0 || zoomLevel > totalTime) return false;
    if (position < 0 || position > 1) return false;
    return true;
  }

  /**
   * Calculate zoom width as a fraction of total time for rectangle drawing
   * @param zoomLevel Zoom level in seconds
   * @param totalTime Total time span
   * @returns Zoom width as fraction (0-1)
   */
  static calculateZoomWidth(zoomLevel: number, totalTime: number): number {
    return Math.min(1, Math.max(0, zoomLevel / totalTime));
  }
}
