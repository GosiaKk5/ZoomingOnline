<!--
  Chart Error Boundary Component
  
  Specialized error boundary for chart rendering errors.
  Provides chart-specific error recovery options.
-->
<script lang="ts">
  import { CircleAlert, AlertTriangle } from '@lucide/svelte';

  interface StoreError {
    message: string;
    code?: string;
  }

  // Props using Svelte 5 runes syntax
  let {
    chartName = '',
    isLoading = false,
    hasDataError = false,
    onRetryData,
    onRetryChart,
    children,
    errorMessage = '',
    showDetails = false,
    onRetry = () => {},
    onError = () => {},
    context = 'Chart'
  } = $props();
  
  // Local error state using $state
  let hasError = $state(false);
  let error = $state<Error | null>(null);
  let errorDetails = $state<StoreError | null>(null);
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
  <div class="flex items-center justify-center min-h-[300px] p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg my-4" role="alert">
    <div class="text-center max-w-md">
      <div class="w-6 h-6 text-red-500 mx-auto mb-4">
        <CircleAlert />
      </div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Data Loading Error</h3>
      <p class="text-gray-600 mb-6 leading-relaxed">Unable to load data for {chartName}.</p>
      <button 
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium transition-colors"
        onclick={handleRetryData}
        type="button"
      >
        Retry Loading Data
      </button>
    </div>
  </div>
{:else if hasChartError}
  <!-- Chart Rendering Error State -->
  <div class="flex items-center justify-center min-h-[300px] p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg my-4" role="alert">
    <div class="text-center max-w-md">
      <div class="w-6 h-6 text-yellow-500 mx-auto mb-4">
        <AlertTriangle />
      </div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Chart Rendering Error</h3>
      <p class="text-gray-600 mb-6 leading-relaxed">Unable to render {chartName}.</p>
      {#if chartError}
        <details class="text-left my-4 border border-gray-200 rounded bg-white">
          <summary class="p-2 bg-gray-50 cursor-pointer text-sm">Error Details</summary>
          <p class="p-3 font-mono text-xs text-red-500 bg-gray-50 m-0">{chartError}</p>
        </details>
      {/if}
      <button 
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium transition-colors"
        onclick={handleRetryChart}
        type="button"
      >
        Retry Chart Rendering
      </button>
    </div>
  </div>
{:else if isLoading}
  <!-- Loading State -->
  <div class="flex items-center justify-center min-h-[300px] p-8">
    <div class="text-center">
      <div class="animate-spin w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600 text-sm">Loading {chartName}...</p>
    </div>
  </div>
{:else}
  <!-- Normal Chart Rendering -->
  {@render children?.()}
{/if}

