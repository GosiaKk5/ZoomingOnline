<script lang="ts">
    // Props using Svelte 5 $props() with proper TypeScript typing
    const { 
        isLoading = false,
        error = null,
        showInitializing = false 
    }: {
        isLoading?: boolean;
        error?: string | null;
        showInitializing?: boolean;
    } = $props();
</script>

{#if isLoading}
    <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-4 text-gray-600">Loading chart data...</span>
    </div>
{:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <p class="text-red-800 font-medium">Chart Error:</p>
        <p class="text-red-600 text-sm mt-1">{error}</p>
    </div>
{:else if showInitializing}
    <div class="flex items-center justify-center h-full py-20">
        <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-500">Initializing chart...</p>
        </div>
    </div>
{/if}