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
  const DEBUG_UI = false;
  if (DEBUG_UI) {
    console.log("🎯 populateSelectors() called");
    console.log("  - store parameter:", store);
    console.log("  - store type:", typeof store);
    console.log("  - store exists:", !!store);
  }

  if (!store) {
    if (DEBUG_UI) console.warn("⚠️ populateSelectors: No store provided");
    return { channels: [], trcFiles: [], segments: [] };
  }

  if (!store.shape) {
    if (DEBUG_UI) {
      console.warn("⚠️ populateSelectors: Store has no shape property");
      console.log("  - Available store properties:", Object.keys(store));
      console.log("  - Store structure:", store);
    }
    return { channels: [], trcFiles: [], segments: [] };
  }

  if (DEBUG_UI) {
    console.log("📐 Store shape analysis:");
    console.log("  - store.shape:", store.shape);
    console.log("  - shape type:", typeof store.shape);
    console.log("  - shape length:", store.shape?.length);
  }

  const [channelCount, trcCount, segmentCount] = store.shape;
  if (DEBUG_UI) {
    console.log("📊 Extracted dimensions:");
    console.log("  - channelCount:", channelCount);
    console.log("  - trcCount:", trcCount);
    console.log("  - segmentCount:", segmentCount);
  }

  // Validate dimensions
  if (
    typeof channelCount !== "number" ||
    typeof trcCount !== "number" ||
    typeof segmentCount !== "number"
  ) {
  if (DEBUG_UI) console.error("❌ Invalid dimensions from store shape");
    return { channels: [], trcFiles: [], segments: [] };
  }

  // Create arrays of options
  if (DEBUG_UI) console.log("🔨 Creating selector arrays...");
  const channels = Array.from(
    { length: channelCount },
    (_, i): string => `Channel ${i + 1}`,
  );
  const trcFiles = Array.from(
    { length: trcCount },
    (_, i): string => `TRC ${i + 1}`,
  );
  const segments = Array.from(
    { length: segmentCount },
    (_, i): string => `Segment ${i + 1}`,
  );

  if (DEBUG_UI) {
    console.log("✅ Generated selectors:");
    console.log("  - channels:", channels);
    console.log("  - trcFiles:", trcFiles);
    console.log("  - segments:", segments);
  }

  const result: SelectorOptions = { channels, trcFiles, segments };
  if (DEBUG_UI) console.log("📤 Returning result:", result);

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
 * Extract the numeric index from a formatted selector value
 * (e.g., "Channel 1" -> 0, "TRC 3" -> 2)
 */
export function parseSelectedIndex(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/(\d+)$/);
  return match && match[1] ? parseInt(match[1]) - 1 : null;
}

/**
 * Get URL parameters from current location
 */
export function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}
