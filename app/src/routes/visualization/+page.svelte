<script lang="ts">
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { 
        isDataReadyForPlot,
        selectedChannelIndex,
        selectedTrcIndex,
        selectedSegmentIndex,
        isLoading,
        isDataLoaded
    } from '../../stores/index';
    
    import Charts from '../../components/Charts.svelte';
    import ShareButton from '../../components/ShareButton.svelte';

    // Local component state using runes
    let hasInitialized = $state(false);

    // Global store access using derived runes
    const plotReady = $derived($isDataReadyForPlot);
    const loading = $derived($isLoading);
    const dataLoaded = $derived($isDataLoaded);
    const channelIndex = $derived($selectedChannelIndex);
    const trcIndex = $derived($selectedTrcIndex);
    const segmentIndex = $derived($selectedSegmentIndex);

    // Navigation guard using runes effect
    $effect(() => {
        // Guard: if visualization isn't ready (no selections/data), navigate back to selection
        if (!plotReady && !loading && dataLoaded && hasInitialized) {
            goto(`${base}/selection`);
            return;
        }

        if (plotReady && !hasInitialized) {
            hasInitialized = true;
        }
    });

    function handleGoBack() {
        goto(`${base}/selection`);
    }
</script>

<svelte:head>
    <title>Data Visualization - ZoomingOnline</title>
</svelte:head>

{#if plotReady}
    <div class="w-full">
        <div class="flex justify-between items-center mb-4 p-6 bg-white rounded-lg shadow-md">
            <div class="flex items-center gap-4">
                <button class="btn-primary btn-sm" onclick={handleGoBack}>
                    ← Back to Selection
                </button>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <span class="font-semibold text-gray-800">Channel:</span>
                    <span class="text-blue-600 font-medium">{channelIndex + 1}</span>
                    <span class="text-gray-500 mx-1">|</span>
                    <span class="font-semibold text-gray-800">TRC:</span>
                    <span class="text-blue-600 font-medium">{trcIndex + 1}</span>
                    <span class="text-gray-500 mx-1">|</span>
                    <span class="font-semibold text-gray-800">Segment:</span>
                    <span class="text-blue-600 font-medium">{segmentIndex + 1}</span>
                </div>
            </div>
            <ShareButton />
        </div>
        
        <Charts />
    </div>
{/if}
