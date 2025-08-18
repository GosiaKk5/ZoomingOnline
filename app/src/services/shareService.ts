/**
 * ShareService - URL generation for sharing functionality
 * 
 * This service handles the generation of complete shareable URLs
 * that include all necessary parameters for dataset and visualization state.
 */

import { get } from "svelte/store";
import { currentDataUrl, selectedChannel, selectedTrc, selectedSegment } from "../stores/index";

export class ShareService {
  /**
   * Generate a complete shareable URL with all parameters
   */
  static generateShareableUrl(): string {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = new URL(baseUrl);
    
    // Always include the data parameter if we have a dataset loaded
    const dataUrl = get(currentDataUrl);
    if (dataUrl) {
      url.searchParams.set('data', dataUrl);
    }
    
    // Include selection parameters if they exist
    const channel = get(selectedChannel);
    const trc = get(selectedTrc);
    const segment = get(selectedSegment);
    
    if (channel) {
      const channelIndex = this.getIndexFromDisplayName(channel);
      url.searchParams.set('channel', channelIndex.toString());
    }
    
    if (trc) {
      const trcIndex = this.getIndexFromDisplayName(trc);
      url.searchParams.set('trc', trcIndex.toString());
    }
    
    if (segment) {
      const segmentIndex = this.getIndexFromDisplayName(segment);
      url.searchParams.set('segment', segmentIndex.toString());
    }
    
    // Include current zoom parameters if they exist in the URL
    const currentUrl = new URL(window.location.href);
    const zoomSample = currentUrl.searchParams.get('zoomSample');
    const zoomLevelIndex = currentUrl.searchParams.get('zoomLevelIndex');
    
    if (zoomSample) {
      url.searchParams.set('zoomSample', zoomSample);
    }
    
    if (zoomLevelIndex) {
      url.searchParams.set('zoomLevelIndex', zoomLevelIndex);
    }
    
    // Ensure we're on the selection route (where data browsing happens)
    return url.toString().replace(url.pathname, '/ZoomingOnline/#/selection');
  }

  /**
   * Get the current URL with all parameters
   */
  static getCurrentUrl(): string {
    return window.location.href;
  }

  /**
   * Check if the current URL has the minimum required parameters
   */
  static hasMinimumParameters(): boolean {
    const dataUrl = get(currentDataUrl);
    return Boolean(dataUrl);
  }

  /**
   * Extract numeric index from display name (e.g., "Channel 1" -> 1)
   */
  private static getIndexFromDisplayName(displayName: string): number {
    const match = displayName.match(/(\d+)$/);
    return match?.[1] ? parseInt(match[1], 10) : 1;
  }

  /**
   * Validate that a URL contains the required parameters
   */
  static validateShareableUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.has('data');
    } catch {
      return false;
    }
  }
}