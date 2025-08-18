/**
 * Application configuration and constants store
 * Contains all read-only configuration values, URLs, and default parameters
 */
import { writable, readonly, type Writable, type Readable } from "svelte/store";

export interface AppConfig {
  // URLs and endpoints
  exampleDataUrl: string;
  githubRepoUrl: string;
  
  // Default values
  defaultZoomLevelIndex: number;
}

// Centralized configuration with readable defaults
const defaultConfig: AppConfig = {
  exampleDataUrl: `${window.location.origin}${(import.meta as any).env?.BASE_URL || '/'}static/example.zarr`,
  githubRepoUrl: "https://github.com/DataMedSci/ZoomingOnline",
  
  defaultZoomLevelIndex: 3
};

// Private writable store
const _appConfig: Writable<AppConfig> = writable(defaultConfig);

// Export readonly version to prevent external modifications
export const appConfig: Readable<AppConfig> = readonly(_appConfig);

// Helper functions for configuration management
export function updateConfig(partial: Partial<AppConfig>): void {
  _appConfig.update(config => ({ ...config, ...partial }));
}

export function resetConfig(): void {
  _appConfig.set(defaultConfig);
}

export function getDefaultConfig(): AppConfig {
  return { ...defaultConfig };
}