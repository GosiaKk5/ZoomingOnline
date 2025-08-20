/**
 * Zoom State Store
 * 
 * Pure zoom state management without business logic.
 * This store focuses only on zoom position and width state.
 * zoomPosition is now an integer representing the sample number in the plot.
 */

import { writable, type Writable } from "svelte/store";

// Zoom rectangle state stores
// zoomPosition: integer sample number (0-based index)
export const zoomPosition: Writable<number> = writable(0);
export const zoomWidth: Writable<number | null> = writable(null);

// Basic zoom state operations
export function setZoomState(position: number, width: number | null = null): void {
	zoomPosition.set(Math.floor(position)); // Ensure integer
	zoomWidth.set(width);
}

export function resetZoomState(): void {
	zoomPosition.set(0); // Reset to first sample
	zoomWidth.set(null);
}

// Set default zoom position based on total samples (middle of the plot)
export function setDefaultZoomPosition(totalSamples: number): void {
	const defaultSample = Math.floor(totalSamples / 2);
	zoomPosition.set(defaultSample);
	console.log(`🎯 Set default zoom position to sample ${defaultSample} (middle of ${totalSamples} samples)`);
}