/**
 * Unified URL Service - Handles all URL parameter synchronization
 * Manages data URLs, selections, zoom state, and sharing functionality
 * with context-aware behavior based on current route
 */

import { get } from "svelte/store";
import { browser } from "$app/environment";
import { replaceState } from "$app/navigation";
import { 
  currentDataUrl, 
  selectedChannel, 
  selectedTrc, 
  selectedSegment
} from "../stores/index";

export type RouteContext = 'main' | 'selection' | 'plot';

export class UrlService {
  private static isUpdating = false;

  /**
   * Core URL manipulation - updates browser URL without triggering navigation
   */
  private static updateUrl(params: Record<string, string | null>): void {
    if (!browser || this.isUpdating) return;
    
    this.isUpdating = true;
    try {
      const url = new URL(window.location.href);
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, value);
        }
      });
      
      // Use SvelteKit's replaceState instead of history.replaceState
      replaceState(url.toString(), {});
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Utility functions for extracting indices from display names
   */
  private static extractIndex(displayName: string): number {
    const match = displayName.match(/(\d+)$/);
    return match?.[1] ? parseInt(match[1], 10) : 1;
  }

  private static createDisplayName(type: 'Channel' | 'TRC' | 'Segment', index: number): string {
    return `${type} ${index}`;
  }

  /**
   * Get current route context based on page path
   */
  private static getCurrentRouteContext(): RouteContext {
    if (!browser) return 'main';
    
    const pathname = window.location.pathname;
    if (pathname.includes('/selection')) return 'selection';
    if (pathname.includes('/visualization')) return 'plot';
    return 'main';
  }

  /**
   * Get URL parameters from current location
   */
  static getUrlParams(): URLSearchParams {
    if (!browser) return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }

  /**
   * Load data behavior - only sets data parameter, clears all others
   * Used when user clicks "Load data" from main page
   */
  static loadDataUrl(dataUrl: string): void {
    this.updateUrl({
      data: dataUrl,
      // Clear all other parameters
      channel: null,
      trc: null,
      segment: null,
      zoomSample: null,
      zoomLevelIndex: null
    });
  }

  /**
   * Initialize selection route with URL parameters
   * Uses URL params when present, falls back to first available values
   */
  static initializeSelectionFromUrl(
    availableChannels: string[],
    availableTrcs: string[],
    availableSegments: string[]
  ): {
    channel: string | null;
    trc: string | null;
    segment: string | null;
  } {
    const params = this.getUrlParams();

    let selectedChannel: string | null = null;
    let selectedTrc: string | null = null;
    let selectedSegment: string | null = null;

    // Handle channel parameter
    const channelParam = params.get('channel');
    if (channelParam && availableChannels.length > 0) {
      const channelIndex = parseInt(channelParam, 10);
      const channelName = this.createDisplayName('Channel', channelIndex);
      selectedChannel = availableChannels.includes(channelName) ? channelName : availableChannels[0] || null;
    } else if (availableChannels.length > 0) {
      selectedChannel = availableChannels[0] || null;
    }

    // Handle TRC parameter
    const trcParam = params.get('trc');
    if (trcParam && availableTrcs.length > 0) {
      const trcIndex = parseInt(trcParam, 10);
      const trcName = this.createDisplayName('TRC', trcIndex);
      selectedTrc = availableTrcs.includes(trcName) ? trcName : availableTrcs[0] || null;
    } else if (availableTrcs.length > 0) {
      selectedTrc = availableTrcs[0] || null;
    }

    // Handle segment parameter
    const segmentParam = params.get('segment');
    if (segmentParam && availableSegments.length > 0) {
      const segmentIndex = parseInt(segmentParam, 10);
      const segmentName = this.createDisplayName('Segment', segmentIndex);
      selectedSegment = availableSegments.includes(segmentName) ? segmentName : availableSegments[0] || null;
    } else if (availableSegments.length > 0) {
      selectedSegment = availableSegments[0] || null;
    }

    return {
      channel: selectedChannel,
      trc: selectedTrc,
      segment: selectedSegment
    };
  }

  /**
   * Update selection parameters in URL
   * Used when user changes dropdown values in selection route
   */
  static updateSelections(): void {
    const params: Record<string, string | null> = {};
    
    const channel = get(selectedChannel);
    const trc = get(selectedTrc);
    const segment = get(selectedSegment);

    params.channel = channel ? this.extractIndex(channel).toString() : null;
    params.trc = trc ? this.extractIndex(trc).toString() : null;
    params.segment = segment ? this.extractIndex(segment).toString() : null;

    this.updateUrl(params);
  }

  /**
   * Initialize plot route with zoom parameters
   * Uses URL params when present, sets defaults when redirected from selection
   */
  static initializePlotFromUrl(): {
    zoomSample: number | null;
    zoomLevelIndex: number | null;
    useDefaults: boolean;
  } {
    const params = this.getUrlParams();
    const zoomSampleParam = params.get('zoomSample');
    const zoomLevelIndexParam = params.get('zoomLevelIndex');

    // If zoom parameters exist in URL, use them
    if (zoomSampleParam !== null || zoomLevelIndexParam !== null) {
      return {
        zoomSample: zoomSampleParam ? parseInt(zoomSampleParam, 10) : null,
        zoomLevelIndex: zoomLevelIndexParam ? parseInt(zoomLevelIndexParam, 10) : null,
        useDefaults: false
      };
    }

    // No zoom parameters in URL - use defaults (user came from selection route)
    return {
      zoomSample: null,
      zoomLevelIndex: null,
      useDefaults: true
    };
  }

  /**
   * Update zoom parameters in URL
   * Used when user changes zoom settings in plot route
   */
  static updateZoomParams(zoomSample: number, zoomLevelIndex: number | null): void {
    const params: Record<string, string | null> = {
      zoomSample: zoomSample.toString(),
      zoomLevelIndex: zoomLevelIndex?.toString() || null
    };
    this.updateUrl(params);
  }

  /**
   * Clear zoom parameters from URL
   */
  static clearZoomParams(): void {
    this.updateUrl({ 
      zoomSample: null, 
      zoomLevelIndex: null 
    });
  }

  /**
   * Generate share URL based on current route context
   * - Selection route: data + channel/trc/segment only
   * - Plot route: data + channel/trc/segment + zoom settings
   */
  static generateShareUrl(): string {
    const url = new URL(window.location.href);
    const routeContext = this.getCurrentRouteContext();
    
    // Always include data URL
    const dataUrl = get(currentDataUrl);
    if (dataUrl) {
      url.searchParams.set('data', dataUrl);
    }
    
    // Always include selection parameters
    const channel = get(selectedChannel);
    const trc = get(selectedTrc);
    const segment = get(selectedSegment);
    
    if (channel) {
      url.searchParams.set('channel', this.extractIndex(channel).toString());
    }
    if (trc) {
      url.searchParams.set('trc', this.extractIndex(trc).toString());
    }
    if (segment) {
      url.searchParams.set('segment', this.extractIndex(segment).toString());
    }
    
    // Include zoom parameters only in plot route
    if (routeContext === 'plot') {
      const currentParams = this.getUrlParams();
      const zoomSample = currentParams.get('zoomSample');
      const zoomLevelIndex = currentParams.get('zoomLevelIndex');
      
      if (zoomSample) {
        url.searchParams.set('zoomSample', zoomSample);
      }
      if (zoomLevelIndex) {
        url.searchParams.set('zoomLevelIndex', zoomLevelIndex);
      }
    } else {
      // Remove zoom parameters for non-plot routes
      url.searchParams.delete('zoomSample');
      url.searchParams.delete('zoomLevelIndex');
    }
    
    return url.toString();
  }

  /**
   * Validate zoom parameters against data constraints
   */
  static validateZoomParams(
    zoomSample: number, 
    zoomLevelIndex: number | null, 
    totalSamples: number, 
    maxZoomLevelIndex: number
  ): { isValid: boolean; sample: number; levelIndex: number | null } {
    const validSample = Math.max(0, Math.min(totalSamples - 1, Math.round(zoomSample)));
    let validLevelIndex = zoomLevelIndex;
    
    if (zoomLevelIndex !== null) {
      validLevelIndex = Math.max(0, Math.min(maxZoomLevelIndex, Math.round(zoomLevelIndex)));
    }
    
    return {
      isValid: validSample === zoomSample && validLevelIndex === zoomLevelIndex,
      sample: validSample,
      levelIndex: validLevelIndex
    };
  }

  /**
   * Get data URL from URL parameters
   */
  static getDataUrlFromParams(): string | null {
    const params = this.getUrlParams();
    return params.get('data');
  }

  /**
   * Check if we have all required parameters for a complete state
   */
  static hasCompleteState(): boolean {
    const params = this.getUrlParams();
    return !!(params.get('data') && params.get('channel') && params.get('trc') && params.get('segment'));
  }

  /**
   * Debug helper - log current URL state
   */
  static debugUrlState(): void {
    if (!browser) return;
    
    const params = this.getUrlParams();
    const state = {
      route: this.getCurrentRouteContext(),
      data: params.get('data'),
      channel: params.get('channel'),
      trc: params.get('trc'),
      segment: params.get('segment'),
      zoomSample: params.get('zoomSample'),
      zoomLevelIndex: params.get('zoomLevelIndex')
    };
    
    console.log('URL State:', state);
  }
}