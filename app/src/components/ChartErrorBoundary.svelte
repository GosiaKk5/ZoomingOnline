<!--
  Chart Error Boundary Component
  
  Specialized error boundary for chart rendering errors.
  Provides chart-specific error recovery options.
-->
<script lang="ts">
  import { CircleAlert, AlertTriangle } from 'lucide-svelte';

  interface Props {
    /** Chart name for error context */
    chartName?: string;
    /** Data loading state */
    isLoading?: boolean;
    /** Data error state */
    hasDataError?: boolean;
    /** Custom retry handler for data loading */
    onRetryData?: () => void;
    /** Custom retry handler for chart rendering */
    onRetryChart?: () => void;
    /** Child content to render */
    children?: any;
  }
  
  const {
    chartName = 'Chart',
    isLoading = false,
    hasDataError = false,
    onRetryData,
    onRetryChart,
    children
  }: Props = $props();
  
  // Local error state for chart rendering
  let hasChartError = $state(false);
  let chartError = $state<string | null>(null);
  
  function handleChartError(error: Error) {
    hasChartError = true;
    chartError = error.message;
    console.error(`Chart rendering error in ${chartName}:`, error);
  }
  
  function handleRetryChart() {
    hasChartError = false;
    chartError = null;
    
    if (onRetryChart) {
      onRetryChart();
    } else {
      // Default retry - reload the page
      window.location.reload();
    }
  }
  
  function handleRetryData() {
    if (onRetryData) {
      onRetryData();
    } else {
      window.location.reload();
    }
  }
  
  // Expose error handler to parent component
  export function captureError(error: Error) {
    handleChartError(error);
  }
</script>

{#if hasDataError}
  <!-- Data Error State -->
  <div class="chart-error-boundary" role="alert">
    <div class="error-content">
      <div class="error-icon">
        <div class="w-6 h-6">
          <CircleAlert />
        </div>
      </div>
      <h3>Data Loading Error</h3>
      <p>Unable to load data for {chartName}.</p>
      <button 
        class="retry-btn" 
        onclick={handleRetryData}
        type="button"
      >
        Retry Loading Data
      </button>
    </div>
  </div>
{:else if hasChartError}
  <!-- Chart Rendering Error State -->
  <div class="chart-error-boundary" role="alert">
    <div class="error-content">
      <div class="error-icon">
        <div class="w-6 h-6">
          <AlertTriangle />
        </div>
      </div>
      <h3>Chart Rendering Error</h3>
      <p>Unable to render {chartName}.</p>
      {#if chartError}
        <details class="error-details">
          <summary>Error Details</summary>
          <p class="error-message">{chartError}</p>
        </details>
      {/if}
      <button 
        class="retry-btn" 
        onclick={handleRetryChart}
        type="button"
      >
        Retry Chart Rendering
      </button>
    </div>
  </div>
{:else if isLoading}
  <!-- Loading State -->
  <div class="chart-loading">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p>Loading {chartName}...</p>
    </div>
  </div>
{:else}
  <!-- Normal Chart Rendering -->
  {@render children?.()}
{/if}

<style>
  .chart-error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 2rem;
    background: #fafafa;
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  .error-content {
    text-align: center;
    max-width: 400px;
  }
  
  .error-icon {
    color: #dc3545;
    margin-bottom: 1rem;
  }
  
  .error-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #212529;
    margin-bottom: 0.5rem;
  }
  
  .error-content p {
    color: #6c757d;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  
  .retry-btn {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .retry-btn:hover {
    background-color: #0056b3;
  }
  
  .error-details {
    text-align: left;
    margin: 1rem 0;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background: white;
  }
  
  .error-details summary {
    padding: 0.5rem;
    background: #f8f9fa;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .error-message {
    padding: 0.75rem;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: #dc3545;
    background: #f8f9fa;
    margin: 0;
  }
  
  .chart-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 2rem;
  }
  
  .loading-content {
    text-align: center;
  }
  
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e9ecef;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  .loading-content p {
    color: #6c757d;
    font-size: 0.875rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .chart-error-boundary {
      min-height: 200px;
      padding: 1rem;
    }
    
    .error-content {
      max-width: 100%;
    }
  }
</style>