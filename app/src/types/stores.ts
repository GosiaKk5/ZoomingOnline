/**
 * Comprehensive type definitions for all store values
 * Centralized location for store-related TypeScript interfaces
 */

// Data Store Types
export interface ZarrGroup {
  root: any;
  attrs: Record<string, any>;
  shape: number[];
  chunks: number[];
  dtype: string;
  metadata?: Record<string, any>;
}

export interface RawDataStore {
  data: Float32Array | Int16Array | number[];
  shape: number[];
  metadata: {
    channel: number;
    trc: number;
    segment: number;
    samples: number;
    dtype: string;
  };
}

export interface OverviewDataPoint {
  time_s: number;
  min_mv: number;
  max_mv: number;
}

export interface OverviewStore {
  data: OverviewDataPoint[];
  metadata: {
    totalSamples: number;
    samplingRate: number;
    duration: number;
  };
}

export interface CacheEntry {
  key: string | null;
  data: any | null;
  timestamp?: number;
  size?: number;
}

// UI Store Types
export type CurrentView = 'home' | 'selection' | 'charts';

export interface UIState {
  isLoading: boolean;
  error: string | null;
  showCopyLink: boolean;
  currentView: CurrentView;
}

// Selection Store Types
export interface SelectionState {
  selectedChannel: number | null;
  selectedTrc: number | null;
  selectedSegment: number | null;
  selectedChannelIndex: number | null;
  selectedTrcIndex: number | null;
  selectedSegmentIndex: number | null;
}

export interface SelectionSummary {
  channel: number | null;
  trc: number | null;
  segment: number | null;
  isComplete: boolean;
  description: string;
}

// Plot Configuration Types
export interface PlotConfig {
  total_time_s: number;
  horiz_interval?: number;
  no_of_samples?: number;
  adcToMv?: (adc: number) => number;
  channel?: number;
  trc?: number;
  segment?: number;
  overviewData?: OverviewDataPoint[];
  globalYMin?: number | undefined;
  globalYMax?: number | undefined;
  samplingRate?: number;
  startTime?: number;
  endTime?: number;
}

// Zoom State Types
export interface ZoomLevel {
  value: number;
  label: string;
  samplesPerPixel: number;
  windowSize: number;
}

export interface ZoomState {
  currentLevel: number;
  availableLevels: ZoomLevel[];
  isZooming: boolean;
  zoomBounds: {
    start: number;
    end: number;
  } | null;
  zoomHistory: Array<{
    level: number;
    bounds: { start: number; end: number };
    timestamp: number;
  }>;
}

// App Configuration Types
export interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  performance: {
    maxConcurrentRequests: number;
    chunkSize: number;
    cacheSize: number;
    enablePreloading: boolean;
  };
  visualization: {
    lineWidth: number;
    pointSize: number;
    colorScheme: string[];
    showGrid: boolean;
    showLegend: boolean;
  };
  debugging: {
    enableLogs: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    showPerformanceMetrics: boolean;
  };
}

// Derived Store Types
export interface DerivedPlotData {
  timeScale: any; // d3.ScaleLinear<number, number>
  valueScale: any; // d3.ScaleLinear<number, number>
  lineGenerator: any; // d3.Line<OverviewDataPoint>
  viewport: {
    width: number;
    height: number;
    margin: { top: number; right: number; bottom: number; left: number };
  };
  visibleDataPoints: OverviewDataPoint[];
  statistics: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
  };
}

// Action Types for store operations
export interface PlotActions {
  initializePlot: () => Promise<void>;
  updateZoomLevel: (level: number) => void;
  resetZoom: () => void;
  panTo: (position: number) => void;
  refreshData: () => Promise<void>;
  exportData: (format: 'json' | 'csv' | 'png') => Promise<void>;
}

// Error Types
export interface StoreError {
  code: string;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  stack?: string | undefined;
}