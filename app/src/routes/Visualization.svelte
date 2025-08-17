<script>
    import { onMount } from 'svelte';
    import { 
        isDataReadyForPlot,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        isLoading,
        isDataLoaded
    } from '../stores/appStore.ts';
    import { push } from 'svelte-spa-router';
    
    import Charts from '../components/Charts.svelte';
    import ShareButton from '../components/ShareButton.svelte';

    function handleGoBack() {
        push('/selection');
    }

    // Redirect to selection if data is not ready (but allow time for loading on refresh)
    let hasAttemptedLoad = false;
    
    $: if (!$isDataReadyForPlot && !$isLoading && hasAttemptedLoad && $isDataLoaded) {
        // Only redirect if we've attempted to load, we're not currently loading,
        // and we have loaded data but selections aren't ready
        push('/selection');
        push('/selection');
    }
    
    // Track when we've attempted to load data to prevent premature redirects
    $: if ($isDataLoaded || $isLoading) {
        hasAttemptedLoad = true;
    }
</script>

{#if $isDataReadyForPlot}
    <div class="w-full">
        <div class="flex justify-between items-center mb-4 p-6 bg-white rounded-lg shadow-md">
            <div class="flex items-center gap-4">
                <button class="btn-primary btn-sm" on:click={handleGoBack}>
                    ← Back to Selection
                </button>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <span class="font-semibold text-gray-800">Channel:</span>
                    <span class="text-blue-600 font-medium">{$selectedChannel}</span>
                    <span class="text-gray-500 mx-1">|</span>
                    <span class="font-semibold text-gray-800">TRC:</span>
                    <span class="text-blue-600 font-medium">{$selectedTrc}</span>
                    <span class="text-gray-500 mx-1">|</span>
                    <span class="font-semibold text-gray-800">Segment:</span>
                    <span class="text-blue-600 font-medium">{$selectedSegment}</span>
                </div>
            </div>
            <ShareButton />
        </div>
        
        <Charts />
    </div>
{/if}
