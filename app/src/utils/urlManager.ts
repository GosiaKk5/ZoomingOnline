/**
 * URL parameter management for zoom state persistence
 * Handles syncing zoom position and width with URL parameters for shareable links
 */

export interface ZoomUrlParams {
  zoomPosition: number | undefined;
  zoomWidth: number | undefined;
}

/**
 * Get zoom parameters from current URL
 */
export function getZoomParamsFromUrl(): ZoomUrlParams {
  const urlParams = new URLSearchParams(window.location.search);
  
  const zoomPositionParam = urlParams.get('zoomPos');
  const zoomWidthParam = urlParams.get('zoomWidth');
  
  return {
    zoomPosition: zoomPositionParam ? parseFloat(zoomPositionParam) : undefined,
    zoomWidth: zoomWidthParam ? parseFloat(zoomWidthParam) : undefined
  };
}

/**
 * Update URL with zoom parameters without triggering navigation
 */
export function updateUrlWithZoomParams(zoomPosition: number, zoomWidth: number | null): void {
  const url = new URL(window.location.href);
  
  // Update zoom position (always present when zooming is active)
  url.searchParams.set('zoomPos', zoomPosition.toFixed(6));
  
  // Update zoom width (null means full width/no zoom)
  if (zoomWidth !== null) {
    url.searchParams.set('zoomWidth', zoomWidth.toFixed(6));
  } else {
    url.searchParams.delete('zoomWidth');
  }
  
  // Use replaceState to update URL without navigation
  window.history.replaceState(null, '', url.toString());
}

/**
 * Clear zoom parameters from URL
 */
export function clearZoomParamsFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('zoomPos');
  url.searchParams.delete('zoomWidth');
  window.history.replaceState(null, '', url.toString());
}

/**
 * Check if the current URL has zoom parameters
 */
export function hasZoomParamsInUrl(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('zoomPos') || urlParams.has('zoomWidth');
}

/**
 * Validate zoom parameters are within acceptable ranges
 */
export function validateZoomParams(zoomPosition: number, zoomWidth: number | null): { 
  isValid: boolean; 
  position: number; 
  width: number | null 
} {
  // Clamp position between 0 and 1
  const validPosition = Math.max(0, Math.min(1, zoomPosition));
  
  // Clamp width between 0 and 1, or allow null
  let validWidth = zoomWidth;
  if (zoomWidth !== null) {
    validWidth = Math.max(0, Math.min(1, zoomWidth));
  }
  
  const isValid = validPosition === zoomPosition && validWidth === zoomWidth;
  
  return {
    isValid,
    position: validPosition,
    width: validWidth
  };
}