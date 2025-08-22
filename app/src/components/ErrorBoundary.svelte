<!--
  Generic Error Boundary Component
  
  Provides a fallback UI for handling errors in Svelte components.
  Follows modern error boundary patterns with customizable error handling.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { CircleAlert } from '@lucide/svelte';
  import type { StoreError } from '../types/stores';
  import type { Snippet } from 'svelte';
  
  // Props using Svelte 5 $props() with proper TypeScript typing
  const { 
    errorMessage = '',
    showDetails = false,
    onRetry = () => {},
    onError = () => {},
    context = 'Component',
    children
  }: {
    errorMessage?: string;
    showDetails?: boolean;
    onRetry?: () => void;
    onError?: (error: Error) => void;
    context?: string;
    children: Snippet;
  } = $props();
  
  // Local error state using Svelte 5 runes
  let hasError = $state(false);
  let error = $state<Error | null>(null);
  let errorDetails = $state<StoreError | null>(null);
  
  // Global error handler setup
  onMount(() => {
    // Global error handler for unhandled promise rejections
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      console.error('Unhandled promise rejection:', event.reason);
      captureError(new Error(`Unhandled promise rejection: ${event.reason}`));
    }
    
    // Add global error listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Cleanup function
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  });
  
  function captureError(err: Error) {
    hasError = true;
    error = err;
    
    // Create detailed error info
    errorDetails = {
      code: 'BOUNDARY_ERROR',
      message: err.message,
      timestamp: Date.now(),
      context: {
        component: context,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      stack: err.stack
    };
    
    // Log error
    console.error(`[${context}] Error boundary caught:`, err);
    
    // Call custom error handler if provided
    if (onError) {
      onError(err);
    }
    
    // Report to error tracking service (example)
    reportError(errorDetails);
  }
  
  function reportError(errorInfo: StoreError) {
    // Example error reporting - replace with actual error service
    try {
      // In production, send to error tracking service
      console.log('Would report error to tracking service:', errorInfo);
    } catch (reportErr) {
      console.error('Failed to report error:', reportErr);
    }
  }
  
  function handleRetry() {
    if (onRetry) {
      // Reset error state first
      hasError = false;
      error = null;
      errorDetails = null;
      
      try {
        onRetry();
      } catch (retryError) {
        captureError(retryError as Error);
      }
    } else {
      // Default retry behavior - reload page
      window.location.reload();
    }
  }
  
  function handleReset() {
    hasError = false;
    error = null;
    errorDetails = null;
  }
</script>

{#if hasError}
  <div class="flex items-center justify-center min-h-[400px] p-8 bg-gray-50 border border-gray-200 rounded-lg md:p-4 md:min-h-[300px]" role="alert">
    <div class="max-w-2xl text-center">
      <!-- Error Icon -->
      <div class="text-red-500 mb-4">
        <div class="w-12 h-12">
          <CircleAlert />
        </div>
      </div>
      
      <!-- Error Title -->
      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
        Something went wrong
      </h2>
      
      <!-- Error Message -->
      <div class="text-base text-gray-600 mb-2 leading-relaxed">
        {errorMessage || error?.message || 'An unexpected error occurred in the application.'}
      </div>
      
      <!-- Error Context -->
      <div class="text-sm text-gray-500 mb-8">
        Error occurred in: <strong>{context}</strong>
      </div>
      
      <!-- Error Actions -->
      <div class="flex gap-4 justify-center mb-8 md:flex-col md:items-stretch">
        <button 
          class="px-6 py-3 border-0 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer transition-colors duration-200 md:w-full"
          onclick={handleRetry}
          type="button"
        >
          Try Again
        </button>
        
        <button 
          class="px-6 py-3 border-0 rounded bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium cursor-pointer transition-colors duration-200 md:w-full"
          onclick={handleReset}
          type="button"
        >
          Dismiss
        </button>
      </div>
      
      <!-- Detailed Error Information -->
      {#if showDetails && errorDetails}
        <details class="text-left mt-4 border border-gray-300 rounded bg-gray-50">
          <summary class="p-3 bg-gray-200 cursor-pointer font-medium">Technical Details</summary>
          <div class="p-4 text-sm">
            <div><strong>Error Code:</strong> {errorDetails.code}</div>
            <div><strong>Timestamp:</strong> {new Date(errorDetails.timestamp).toLocaleString()}</div>
            {#if errorDetails.context}
              <div><strong>Context:</strong></div>
              <pre class="bg-gray-100 p-2 rounded overflow-x-auto text-xs my-2">{JSON.stringify(errorDetails.context, null, 2)}</pre>
            {/if}
            {#if errorDetails.stack}
              <div><strong>Stack Trace:</strong></div>
              <pre class="bg-gray-100 p-2 rounded overflow-x-auto text-xs my-2 max-h-48 overflow-y-auto">{errorDetails.stack}</pre>
            {/if}
          </div>
        </details>
      {/if}
      
      <!-- Development Mode Information -->
      <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-left text-sm">
        <p><strong>Development Mode:</strong> This error boundary caught an error during development.</p>
        <p>Check the browser console for additional details.</p>
      </div>
    </div>
  </div>
{:else}
  <!-- Render children normally -->
  {@render children()}
{/if}

