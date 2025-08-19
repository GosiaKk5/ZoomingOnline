<script>
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import { 
        isDataReadyForPlot,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        isLoading,
        isDataLoaded
    } from '../stores/index.ts';
    import { push } from '../router.ts';
    
    import Charts from '../components/Charts.svelte';
    import ShareButton from '../components/ShareButton.svelte';

    function handleGoBack() {
        push('/selection');
    }

    // Guard: if visualization isn't ready (no selections/data), navigate back to selection.
    // Use lifecycle + subscriptions instead of reactive blocks to avoid Svelte 5 effect_orphan.
    onMount(() => {
        // Immediate check on mount
        if (!get(isDataReadyForPlot) && !get(isLoading) && get(isDataLoaded)) {
            push('/selection');
            return; // no need to subscribe further if we already redirect
        }

        const unsubReady = isDataReadyForPlot.subscribe((ready) => {
            if (!ready && !get(isLoading) && get(isDataLoaded)) {
                push('/selection');
            }
        });
        return () => {
            unsubReady && unsubReady();
        };
    });
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
