/**
 * UI state management store
 * Handles loading states, errors, and UI interaction states
 */
import { writable, derived, type Writable, type Readable } from "svelte/store";
import type { CurrentView } from "../types/stores";

// UI state stores with proper typing
export const isLoading: Writable<boolean> = writable(false);
export const error: Writable<string | null> = writable(null);
export const showCopyLink: Writable<boolean> = writable(false);
export const currentView: Writable<CurrentView> = writable('home');

// Derived UI states for better component integration
export const hasError: Readable<boolean> = derived(
  [error],
  ([$error]) => Boolean($error)
);

export const canInteract: Readable<boolean> = derived(
  [isLoading, error],
  ([$isLoading, $error]) => !$isLoading && !$error
);

export const uiState: Readable<{
  isLoading: boolean;
  hasError: boolean;
  error: string | null;
  canInteract: boolean;
}> = derived(
  [isLoading, error, hasError, canInteract],
  ([$isLoading, $error, $hasError, $canInteract]) => ({
    isLoading: $isLoading,
    hasError: $hasError,
    error: $error,
    canInteract: $canInteract
  })
);

// Helper functions for UI state management
export function setLoadingState(loading: boolean): void {
  isLoading.set(loading);
  if (loading) {
    error.set(null);
  }
}

export function setError(errorMessage: string): void {
  error.set(errorMessage);
  isLoading.set(false);
}

export function clearError(): void {
  error.set(null);
}

export function resetUIState(): void {
  isLoading.set(false);
  error.set(null);
  showCopyLink.set(false);
  currentView.set('home');
}

export function toggleCopyLink(): void {
  showCopyLink.update(show => !show);
}

export function showCopyLinkTemporarily(duration: number = 2000): void {
  showCopyLink.set(true);
  setTimeout(() => {
    showCopyLink.set(false);
  }, duration);
}