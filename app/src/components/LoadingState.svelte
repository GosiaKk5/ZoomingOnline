<script lang="ts">
    interface Props {
        isLoading?: boolean;
        error?: string;
        loadingMessage?: string;
        errorTitle?: string;
        showRetryButton?: boolean;
        showBackButton?: boolean;
        retryText?: string;
        backText?: string;
        onretry?: () => void;
        onback?: () => void;
    }
    
    const { 
        isLoading = false,
        error = '',
        loadingMessage = 'Loading data...',
        errorTitle = 'Error Loading Data',
        showRetryButton = true,
        showBackButton = true,
        retryText = 'Try Again',
        backText = '← Back to Home',
        onretry,
        onback
    }: Props = $props();
    
    function handleRetry() {
        onretry?.();
    }
    
    function handleBack() {
        onback?.();
    }
</script>

{#if isLoading}
    <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>{loadingMessage}</p>
    </div>
{:else if error}
    <div class="error-container">
        <h3>{errorTitle}</h3>
        <p>{error}</p>
        <div class="error-actions">
            {#if showRetryButton}
                <button class="btn-secondary" onclick={handleRetry}>
                    {retryText}
                </button>
            {/if}
            {#if showBackButton}
                <button class="btn-secondary" onclick={handleBack}>
                    {backText}
                </button>
            {/if}
        </div>
    </div>
{/if}

<style>
    .loading-container, .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
    }

    .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 2s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .error-container h3 {
        margin-top: 0;
        color: #dc3545;
    }

    .error-container p {
        color: #dc3545;
        margin-bottom: 1.5rem;
    }

    .error-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;
    }
</style>