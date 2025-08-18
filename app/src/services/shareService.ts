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
    // Start with current URL to preserve the structure
    const currentUrl = new URL(window.location.href);
    
    // Always include the data parameter if we have a dataset loaded
    const dataUrl = get(currentDataUrl);
    if (dataUrl) {
      currentUrl.searchParams.set('data', dataUrl);
    }
    
    // Include selection parameters if they exist
    const channel = get(selectedChannel);
    const trc = get(selectedTrc);
    const segment = get(selectedSegment);
    
    if (channel) {
      const channelIndex = this.getIndexFromDisplayName(channel);
      currentUrl.searchParams.set('channel', channelIndex.toString());
    }
    
    if (trc) {
      const trcIndex = this.getIndexFromDisplayName(trc);
      currentUrl.searchParams.set('trc', trcIndex.toString());
    }
    
    if (segment) {
      const segmentIndex = this.getIndexFromDisplayName(segment);
      currentUrl.searchParams.set('segment', segmentIndex.toString());
    }
    
    // Include current zoom parameters if they exist in the URL
    const zoomSample = currentUrl.searchParams.get('zoomSample');
    const zoomLevelIndex = currentUrl.searchParams.get('zoomLevelIndex');
    
    if (zoomSample) {
      currentUrl.searchParams.set('zoomSample', zoomSample);
    }
    
    if (zoomLevelIndex) {
      currentUrl.searchParams.set('zoomLevelIndex', zoomLevelIndex);
    }
    
    return currentUrl.toString();
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