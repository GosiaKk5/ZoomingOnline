/**
 * Zoom State Store
 * 
 * Pure zoom state management without business logic.
 * This store focuses only on zoom position and width state.
 */

import { writable, type Writable } from "svelte/store";

// Zoom rectangle state stores
export const zoomPosition: Writable<number> = writable(0.5);
export const zoomWidth: Writable<number | null> = writable(null);

// Basic zoom state operations
export function setZoomState(position: number, width: number | null = null): void {
	zoomPosition.set(position);
	zoomWidth.set(width);
}

export function resetZoomState(): void {
	zoomPosition.set(0.5);
	zoomWidth.set(null);
}