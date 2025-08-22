<script lang="ts">
    // Props using Svelte 5 $props() with proper TypeScript typing
    const { 
        isLoading = false,
        error = '',
        loadingMessage = 'Loading data...',
        errorTitle = 'Error Loading Data',
        showRetryButton = true,
        showBackButton = true,
        retryText = 'Try Again',
        backText = '← Back to Home',
        onretry = () => {},
        onback = () => {}
    }: {
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
    } = $props();
    
    function handleRetry(): void {
        onretry?.();
    }
    
    function handleBack(): void {
        onback?.();
    }
</script>

{#if isLoading}
    <div class="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div class="animate-spin w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full mb-4"></div>
        <p class="text-gray-600">{loadingMessage}</p>
    </div>
{:else if error}
    <div class="flex flex-col items-center justify-center py-16 px-8 text-center">
        <h3 class="text-xl font-semibold text-red-600 mt-0 mb-2">{errorTitle}</h3>
        <p class="text-red-600 mb-6">{error}</p>
        <div class="flex gap-4 flex-wrap justify-center">
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

