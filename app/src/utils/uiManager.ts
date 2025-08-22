/**
 * uiManager.ts
 *
 * Manages user interface elements and interactions for the ZoomingOnline application.
 * Handles populating selectors, managing UI state, and clipboard functionality.
 * Adapted for Svelte store-based state management.
 */

/**
 * Interface for selector options
 */
export interface SelectorOptions {
  channels: string[];
  trcFiles: string[];
  segments: string[];
}

/**
 * Interface for data store with shape information
 */
interface DataStore {
  shape: number[];
  [key: string]: any;
}

/**
 * Populate the dropdown selectors for channel, TRC, and segment
 * based on the data dimensions from the loaded store
 */
export async function populateSelectors(
  store: DataStore | null,
): Promise<SelectorOptions> {
  if (!store) {
    return { channels: [], trcFiles: [], segments: [] };
  }

  if (!store.shape) {
    return { channels: [], trcFiles: [], segments: [] };
  }

  const [channelCount, trcCount, segmentCount] = store.shape;

  // Validate dimensions
  if (
    typeof channelCount !== "number" ||
    typeof trcCount !== "number" ||
    typeof segmentCount !== "number"
  ) {
    return { channels: [], trcFiles: [], segments: [] };
  }

  // Create arrays of options - using just numbers
  const channels = Array.from(
    { length: channelCount },
    (_, i): string => `${i + 1}`,
  );
  const trcFiles = Array.from(
    { length: trcCount },
    (_, i): string => `${i + 1}`,
  );
  const segments = Array.from(
    { length: segmentCount },
    (_, i): string => `${i + 1}`,
  );

  const result: SelectorOptions = { channels, trcFiles, segments };

  return result;
}

/**
 * Create a shareable URL with the current data parameter
 */
export function createShareableUrl(dataUrl: string): string {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("data", dataUrl);
  return currentUrl.toString();
}

/**
 * Extract the numeric index from a numeric selector value
 * (e.g., "1" -> 0, "3" -> 2)
 */
export function parseSelectedIndex(value: string | null): number | null {
  if (!value) return null;
  const numericValue = parseInt(value);
  return isNaN(numericValue) ? null : numericValue - 1;
}

/**
 * Get URL parameters from current location
 */
export function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}
