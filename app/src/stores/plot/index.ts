/**
 * Plot Store Index
 * 
 * Centralized exports for the refactored plot store modules.
 * This maintains backward compatibility while providing the new structure.
 */

// Core stores
export * from "./plotConfig";
export * from "./zoomState";
export * from "./derivedStores";

// Actions
export { plotActions } from "./actions";

// Services (re-exported for convenience)
export { ZoomService } from "../../services/zoomService";
export { ZoomUrlService } from "../../services/zoomUrlService";

// Legacy compatibility exports
export {
  plotConfig as default,
  resetPlotConfig as resetPlotState,
  updatePlotConfig
} from "./plotConfig";

export {
  setZoomState,
  resetZoomState as resetZoom
} from "./zoomState";

// Legacy function exports for backward compatibility
export const getDefaultZoomLevelIndex = (totalLevels: number): number => {
  return Math.min(3, totalLevels - 1);
};

export const getDefaultZoomLevel = (zoomLevelsWithLabels: Array<{ value: number; label: string }>): number | undefined => {
  if (zoomLevelsWithLabels.length === 0) return undefined;
  const defaultIndex = getDefaultZoomLevelIndex(zoomLevelsWithLabels.length);
  return zoomLevelsWithLabels[zoomLevelsWithLabels.length - 1 - defaultIndex]?.value;
};

export const calculateZoomBounds = (position: number, width: number | null, totalTime: number): {
  startTime: number;
  endTime: number;
} => {
  if (!width) {
    return { startTime: 0, endTime: totalTime };
  }
  
  const halfWidth = width / 2;
  const startTime = Math.max(0, (position - halfWidth) * totalTime);
  const endTime = Math.min(totalTime, (position + halfWidth) * totalTime);
  
  return { startTime, endTime };
};