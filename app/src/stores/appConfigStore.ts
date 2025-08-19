/**
 * Application configuration and constants store
 * Contains all read-only configuration values, URLs, and default parameters
 */
import { writable, readonly, type Writable, type Readable } from "svelte/store";
import { browser } from '$app/environment';

export interface AppConfig {
  // URLs and endpoints
  exampleDataUrl: string;
  githubRepoUrl: string;
  
  // Default values
  defaultZoomLevelIndex: number;
  
  // Chart configuration
  chartConfig: {
    margin: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    fullWidth: number;
    chartHeight: number;
  };
}

// Centralized configuration with readable defaults
const defaultConfig: AppConfig = {
  exampleDataUrl: browser 
    ? `${window.location.origin}${((import.meta as any).env?.BASE_URL || '/').replace(/\/$/, '')}/downloads/example.zarr`
    : '/downloads/example.zarr',
  githubRepoUrl: "https://github.com/DataMedSci/ZoomingOnline",
  
  defaultZoomLevelIndex: 3,
  
  // Chart dimensions and margins - moved from chartRenderer.ts
  chartConfig: {
    margin: { top: 40, right: 40, bottom: 50, left: 60 },
    fullWidth: 900,
    chartHeight: 300
  }
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