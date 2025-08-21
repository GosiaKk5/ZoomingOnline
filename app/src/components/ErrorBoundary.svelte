<!--
  Generic Error Boundary Component
  
  Provides a fallback UI for handling errors in Svelte components.
  Follows modern error boundary patterns with customizable error handling.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import MdError from 'svelte-icons/md/MdError.svelte';
  import type { StoreError } from '../types/stores';
  
  interface Props {
    /** Optional custom error message */
    errorMessage?: string;
    /** Whether to show detailed error information (stack trace, etc.) */
    showDetails?: boolean;
    /** Custom retry handler - if not provided, page refresh will be used */
    onRetry?: () => void;
    /** Custom error reporting handler */
    onError?: (error: Error) => void;
    /** Context information for error reporting */
    context?: string;
    /** Child content to render */
    children?: any;
  }
  
  let {
    errorMessage,
    showDetails = false,
    onRetry,
    onError,
    context = 'Component',
    children
  }: Props = $props();
  
  // Local error state
  let hasError = $state(false);
  let error = $state<Error | null>(null);
  let errorDetails = $state<StoreError | null>(null);
  
  onMount(() => {
    // Global error handler for unhandled promise rejections
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      console.error('Unhandled promise rejection:', event.reason);
      captureError(new Error(`Unhandled promise rejection: ${event.reason}`));
    }
    
    // Add global error listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
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
  <div class="error-boundary" role="alert">
    <div class="error-boundary-container">
      <!-- Error Icon -->
      <div class="error-icon">
        <div class="w-12 h-12">
          <MdError />
        </div>
      </div>
      
      <!-- Error Title -->
      <h2 class="error-title">
        Something went wrong
      </h2>
      
      <!-- Error Message -->
      <div class="error-message">
        {errorMessage || error?.message || 'An unexpected error occurred in the application.'}
      </div>
      
      <!-- Error Context -->
      <div class="error-context">
        Error occurred in: <strong>{context}</strong>
      </div>
      
      <!-- Error Actions -->
      <div class="error-actions">
        <button 
          class="btn btn-primary"
          onclick={handleRetry}
          type="button"
        >
          Try Again
        </button>
        
        <button 
          class="btn btn-secondary"
          onclick={handleReset}
          type="button"
        >
          Dismiss
        </button>
      </div>
      
      <!-- Detailed Error Information -->
      {#if showDetails && errorDetails}
        <details class="error-details">
          <summary>Technical Details</summary>
          <div class="error-details-content">
            <div><strong>Error Code:</strong> {errorDetails.code}</div>
            <div><strong>Timestamp:</strong> {new Date(errorDetails.timestamp).toLocaleString()}</div>
            {#if errorDetails.context}
              <div><strong>Context:</strong></div>
              <pre>{JSON.stringify(errorDetails.context, null, 2)}</pre>
            {/if}
            {#if errorDetails.stack}
              <div><strong>Stack Trace:</strong></div>
              <pre class="error-stack">{errorDetails.stack}</pre>
            {/if}
          </div>
        </details>
      {/if}
      
      <!-- Development Mode Information -->
      <div class="error-dev-info">
        <p><strong>Development Mode:</strong> This error boundary caught an error during development.</p>
        <p>Check the browser console for additional details.</p>
      </div>
    </div>
  </div>
{:else}
  <!-- Render children normally -->
  {@render children?.()}
{/if}

<style>
  .error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 2rem;
    background: #fefefe;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }
  
  .error-boundary-container {
    max-width: 600px;
    text-align: center;
  }
  
  .error-icon {
    color: #dc3545;
    margin-bottom: 1rem;
  }
  
  .error-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #212529;
    margin-bottom: 1rem;
  }
  
  .error-message {
    font-size: 1rem;
    color: #6c757d;
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }
  
  .error-context {
    font-size: 0.875rem;
    color: #868e96;
    margin-bottom: 2rem;
  }
  
  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #0056b3;
  }
  
  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }
  
  .btn-secondary:hover {
    background-color: #545b62;
  }
  
  .error-details {
    text-align: left;
    margin-top: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background: #f8f9fa;
  }
  
  .error-details summary {
    padding: 0.75rem;
    background: #e9ecef;
    cursor: pointer;
    font-weight: 500;
  }
  
  .error-details-content {
    padding: 1rem;
    font-size: 0.875rem;
  }
  
  .error-details pre {
    background: #f1f3f4;
    padding: 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.75rem;
    margin: 0.5rem 0;
  }
  
  .error-stack {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .error-dev-info {
    margin-top: 1rem;
    padding: 1rem;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    text-align: left;
    font-size: 0.875rem;
  }
  
  @media (max-width: 768px) {
    .error-boundary {
      padding: 1rem;
      min-height: 300px;
    }
    
    .error-actions {
      flex-direction: column;
      align-items: stretch;
    }
    
    .btn {
      width: 100%;
    }
  }
</style>