/**
 * Plot Store Index
 * 
 * Centralized exports for the refactored plot store modules.
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

// Forward utility functions to ZoomService to keep a single source of truth
import { ZoomService } from "../../services/zoomService";

export const getDefaultZoomLevelIndex = ZoomService.getDefaultZoomLevelIndex;
export const getDefaultZoomLevel = ZoomService.getDefaultZoomLevel;
export const calculateZoomBounds = ZoomService.calculateZoomBounds;