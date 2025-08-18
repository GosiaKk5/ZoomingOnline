<script>
    import { onMount } from 'svelte';
    import { 
        isLoading, 
        error, 
        isDataLoaded,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        rawStore,
        overviewStore,
        zarrGroup,
        dataUrl,
        isDataReadyForPlot,
        showCopyLink
    } from '../stores/index.ts';
    import { populateSelectors } from '../utils/uiManager.ts';
    import { push } from 'svelte-spa-router';
    import ShareButton from '../components/ShareButton.svelte';
    import DatasetInfo from '../components/DatasetInfo.svelte';

    let channels = [];
    let trcFiles = [];
    let segments = [];
    let selectorsPopulated = false; // Flag to prevent infinite loop

    // Dataset metadata
    let datasetInfo = {
        pointsInSegment: 0,
        timeBetweenPoints: 0, // in seconds
        segmentLength: 0, // in seconds
        totalDataSize: 0,
        url: ''
    };

    // Calculate dataset metadata when data is available
    $: if ($rawStore && $zarrGroup && $dataUrl) {
        calculateDatasetInfo();
    }

    async function calculateDatasetInfo() {
        try {
            // Get basic info from rawStore shape
            const shape = $rawStore.shape;
            const pointsInSegment = shape[3]; // Last dimension is time samples
            
            // Get attributes from zarr group
            const attrs = await $zarrGroup.attrs.asObject();
            
            // Calculate total data size
            const rawDataElements = shape.reduce((a, b) => a * b, 1);
            const overviewShape = $overviewStore?.shape || [0, 0, 0, 0, 0];
            const overviewElements = overviewShape.reduce((a, b) => a * b, 1);
            
            // Assume 2 bytes per element (int16) for raw data and overview
            const totalBytes = (rawDataElements * 2) + (overviewElements * 2);
            
            datasetInfo = {
                pointsInSegment,
                timeBetweenPoints: attrs.horiz_interval, // in seconds
                segmentLength: (pointsInSegment - 1) * attrs.horiz_interval, // in seconds
                totalDataSize: totalBytes,
                url: $dataUrl
            };
            
            
        } catch (error) {
            // Error calculating dataset metadata
        }
    }

    // Reactive statements - only populate once when rawStore becomes available
    $: if ($rawStore && !selectorsPopulated) {
        selectorsPopulated = true; // Set flag to prevent re-population
        
        populateSelectors($rawStore).then(data => {
            channels = data.channels;
            trcFiles = data.trcFiles;
            segments = data.segments;
            
            // Set default values to first available option if not already set
            if (channels.length > 0 && (!$selectedChannel || $selectedChannel === '')) {
                selectedChannel.set(channels[0]);
            }
            if (trcFiles.length > 0 && (!$selectedTrc || $selectedTrc === '')) {
                selectedTrc.set(trcFiles[0]);
            }
            if (segments.length > 0 && (!$selectedSegment || $selectedSegment === '')) {
                selectedSegment.set(segments[0]);
            }            
        }).catch(err => {
            selectorsPopulated = false; // Reset flag on error so user can retry
        });
    }

    // Show copy link when data is loaded
    $: if ($isDataLoaded) {
        showCopyLink.set(true);
    }

    function handlePlotData() {        
        if ($isDataReadyForPlot) {
            push('/visualization');
        } else {
            console.log('⚠️ Data not ready for plot');
        }
    }

    function handleGoBack() {
        push('/');
    }
</script>

<div class="container-center">
    {#if $isLoading}
        <div class="loading">
            <p>Loading data selectors...</p>
        </div>
    {:else if $error}
        <div class="text-red-600 p-4">
            <h3 class="font-semibold mb-2">Error</h3>
            <p class="mb-4">{$error}</p>
            <button class="btn-primary" on:click={handleGoBack}>
                Try Again
            </button>
        </div>
    {:else if $isDataLoaded}
        <div class="flex justify-between items-center mb-4">
            <button class="btn-primary btn-sm" on:click={handleGoBack}>
                ← Back to Data Input
            </button>
            <ShareButton />
        </div>
        
        <!-- Dataset Information Display -->
        <DatasetInfo {datasetInfo} />
        
        <h3 class="text-xl font-semibold my-4 text-gray-800">Select Data Parameters</h3>
        
        <div class="flex flex-wrap gap-4 justify-center mb-6">
            <div class="form-group min-w-[200px]">
                <label for="channel-select" class="block text-sm font-medium text-gray-700 mb-1 text-center">Channel:</label>
                <select id="channel-select" class="form-control w-full" bind:value={$selectedChannel}>
                    {#each channels as channel}
                        <option value={channel}>{channel}</option>
                    {/each}
                </select>
            </div>
            
            <div class="form-group min-w-[200px]">
                <label for="trc-select" class="block text-sm font-medium text-gray-700 mb-1 text-center">TRC File:</label>
                <select id="trc-select" class="form-control w-full" bind:value={$selectedTrc}>
                    {#each trcFiles as trc}
                        <option value={trc}>{trc}</option>
                    {/each}
                </select>
            </div>
            
            <div class="form-group min-w-[200px]">
                <label for="segment-select" class="block text-sm font-medium text-gray-700 mb-1 text-center">Segment:</label>
                <select id="segment-select" class="form-control w-full" bind:value={$selectedSegment}>
                    {#each segments as segment}
                        <option value={segment}>{segment}</option>
                    {/each}
                </select>
            </div>
        </div>
        
        <button 
            class="btn-primary mt-8"
            on:click={handlePlotData}
            disabled={!$isDataReadyForPlot}
        >
            Plot Selected Data
        </button>
    {/if}
</div>

<style>
    .loading {
        padding: 2rem;
        color: #666;
        font-style: italic;
    }
</style>
