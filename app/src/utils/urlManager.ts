/**
 * URL parameter management for zoom state persistence
 * Handles syncing zoom position (sample number) and width (dropdown index) with URL parameters for shareable links
 */

export interface ZoomUrlParams {
  zoomSample: number | undefined;  // Sample number at center of zoom rectangle
  zoomLevelIndex: number | undefined;  // Index in the zoom level dropdown
}

/**
 * Get zoom parameters from current URL
 */
export function getZoomParamsFromUrl(): ZoomUrlParams {
  const urlParams = new URLSearchParams(window.location.search);
  
  const zoomSampleParam = urlParams.get('zoomSample');
  const zoomLevelIndexParam = urlParams.get('zoomLevelIndex');
  
  return {
    zoomSample: zoomSampleParam ? parseInt(zoomSampleParam, 10) : undefined,
    zoomLevelIndex: zoomLevelIndexParam ? parseInt(zoomLevelIndexParam, 10) : undefined
  };
}

/**
 * Update URL with zoom parameters without triggering navigation
 */
export function updateUrlWithZoomParams(zoomSample: number, zoomLevelIndex: number | null): void {
  const url = new URL(window.location.href);
  
  // Update zoom sample (always present when zooming is active)
  url.searchParams.set('zoomSample', zoomSample.toString());
  
  // Update zoom level index (null means default/no specific zoom level)
  if (zoomLevelIndex !== null) {
    url.searchParams.set('zoomLevelIndex', zoomLevelIndex.toString());
  } else {
    url.searchParams.delete('zoomLevelIndex');
  }
  
  // Use replaceState to update URL without navigation
  window.history.replaceState(null, '', url.toString());
}

/**
 * Clear zoom parameters from URL
 */
export function clearZoomParamsFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('zoomSample');
  url.searchParams.delete('zoomLevelIndex');
  window.history.replaceState(null, '', url.toString());
}

/**
 * Check if the current URL has zoom parameters
 */
export function hasZoomParamsInUrl(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('zoomSample') || urlParams.has('zoomLevelIndex');
}

/**
 * Validate zoom parameters are within acceptable ranges
 */
export function validateZoomParams(
  zoomSample: number, 
  zoomLevelIndex: number | null, 
  totalSamples: number, 
  maxZoomLevelIndex: number
): { 
  isValid: boolean; 
  sample: number; 
  levelIndex: number | null 
} {
  // Clamp sample number between 0 and totalSamples-1
  const validSample = Math.max(0, Math.min(totalSamples - 1, Math.round(zoomSample)));
  
  // Clamp level index between 0 and maxZoomLevelIndex, or allow null
  let validLevelIndex = zoomLevelIndex;
  if (zoomLevelIndex !== null) {
    validLevelIndex = Math.max(0, Math.min(maxZoomLevelIndex, Math.round(zoomLevelIndex)));
  }
  
  const isValid = validSample === zoomSample && validLevelIndex === zoomLevelIndex;
  
  return {
    isValid,
    sample: validSample,
    levelIndex: validLevelIndex
  };
}