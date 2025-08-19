<script>
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { 
        isDataReadyForPlot,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        isLoading,
        isDataLoaded
    } from '../../stores/index.ts';
    
    import Charts from '../../components/Charts.svelte';
    import ShareButton from '../../components/ShareButton.svelte';

    function handleGoBack() {
        goto(`${base}/selection`);
    }

    // Guard: if visualization isn't ready (no selections/data), navigate back to selection.
    onMount(() => {
        // Immediate check on mount
        if (!get(isDataReadyForPlot) && !get(isLoading) && get(isDataLoaded)) {
            goto(`${base}/selection`);
            return;
        }

        const unsubReady = isDataReadyForPlot.subscribe((ready) => {
            if (!ready && !get(isLoading) && get(isDataLoaded)) {
                goto(`${base}/selection`);
            }
        });
        return () => {
            unsubReady && unsubReady();
        };
    });
</script>

<svelte:head>
    <title>Data Visualization - ZoomingOnline</title>
</svelte:head>

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
