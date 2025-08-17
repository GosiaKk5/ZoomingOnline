/**
 * timeUtils.ts
 *
 * Handles time-related functionality for the ZoomingOnline application.
 * Manages time step generation for the overview visualization.
 * Adapted for Svelte store-based state management.
 */

import { timeSteps } from "../stores/appStore.ts";
import { formatTimeFromMicroseconds } from "./mathUtils.ts";
import { get } from "svelte/store";
import type { TimeStep } from "../stores/appStore.ts";

/**
 * Type definition for units and their conversion factors
 */
interface UnitConversions {
  [key: string]: number;
}

/**
 * Generate a comprehensive set of time step options across different units
 * Creates an array of time steps from nanoseconds to milliseconds
 * with appropriate scaling for use in controls
 */
export function generateTimeSteps(): void {
  console.log("⏰ generateTimeSteps() called");

  const currentSteps = get(timeSteps);
  console.log("  - Current time steps length:", currentSteps.length);

  if (currentSteps.length > 0) {
    console.log("  - Time steps already exist, skipping generation");
    return;
  }

  console.log("  - Generating new time steps...");

  // Define units and their conversion factors to microseconds
  const units: UnitConversions = { ns: 1e-3, µs: 1, ms: 1e3 };
  const bases = [1, 2, 5]; // Standard bases for logarithmic scale
  const addedValues = new Set<number>(); // Track unique values to avoid duplicates
  const newTimeSteps: TimeStep[] = [];

  // Generate time steps across multiple units and magnitudes
  for (const unit in units) {
    for (let mag = 1; mag <= 1000; mag *= 10) {
      // Skip ranges that would be excessive for practical use
      if (unit === "ns" && mag > 500) continue;
      if (unit === "ms" && mag > 10) continue; // Allow up to 10ms

      bases.forEach((base) => {
        const val = base * mag;
        if (unit === "ms" && val > 10) return; // Max 10ms
        if (unit === "ns" && val > 500) return; // Max 500ns

        const value_us = val * units[unit]!; // Non-null assertion since we're iterating over keys
        if (!addedValues.has(value_us)) {
          newTimeSteps.push({
            label: formatTimeFromMicroseconds(value_us),
            value_us: value_us,
          });
          addedValues.add(value_us);
        }
      });
    }
  }

  // Sort by increasing duration and update store
  newTimeSteps.sort((a, b) => a.value_us - b.value_us);
  console.log("  - Generated time steps count:", newTimeSteps.length);
  console.log("  - Sample time steps:", newTimeSteps.slice(0, 10));

  timeSteps.set(newTimeSteps);
  console.log("✅ Time steps generated and stored");
}

/**
 * Get formatted time label for a time step value using SI formatting
 */
export function formatTimeLabel(valueUs: number): string {
  return formatTimeFromMicroseconds(valueUs);
}
