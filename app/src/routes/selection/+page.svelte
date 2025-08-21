<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { base } from '$app/paths';
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
    } from '../../stores/index';
    import { populateSelectors } from '../../utils/uiManager';
    import { UrlService } from '../../services/urlService';
    import ShareButton from '../../components/ShareButton.svelte';
    import DatasetInfo from '../../components/DatasetInfo.svelte';
    import SelectionForm from '../../components/SelectionForm.svelte';
    import LoadingState from '../../components/LoadingState.svelte';

    // Local state using runes - component-specific data
    let channels = $state([]);
    let trcFiles = $state([]);
    let segments = $state([]);
    let selectorsPopulated = $state(false); // Flag to prevent infinite loop
    let urlSelectionApplied = $state(false); // Flag to track if URL selection has been applied

    // Dataset metadata - local state
    let datasetInfo = $state({
        pointsInSegment: 0,
        timeBetweenPoints: 0, // in seconds
        segmentLength: 0, // in seconds
        totalDataSize: 0,
        url: ''
    });

    // Derived state for component logic
    let shouldCalculateDatasetInfo = $derived($rawStore && $zarrGroup && $dataUrl);
    let shouldPopulateSelectors = $derived($rawStore && !selectorsPopulated);
    let shouldUpdateUrl = $derived(selectorsPopulated && urlSelectionApplied && ($selectedChannel || $selectedTrc || $selectedSegment));
    let shouldResetSelectors = $derived(!$rawStore);

    // Effects to handle reactive behaviors
    $effect(() => {
        if (shouldCalculateDatasetInfo) {
            calculateDatasetInfo();
        }
    });

    $effect(async () => {
        if (shouldPopulateSelectors) {
            const data = await populateSelectors($rawStore);
            channels = data.channels;
            trcFiles = data.trcFiles;
            segments = data.segments;
            selectorsPopulated = true;
            
            if (!urlSelectionApplied) {
                applyUrlSelection();
                urlSelectionApplied = true;
            }
        }
    });

    $effect(() => {
        if (shouldUpdateUrl) {
            UrlService.updateSelections();
        }
    });

    $effect(() => {
        if (shouldResetSelectors) {
            selectorsPopulated = false;
            urlSelectionApplied = false;
            channels = [];
            trcFiles = [];
            segments = [];
        }
    });

    async function calculateDatasetInfo() {
        try {
            // Get basic info from rawStore shape
            const shape = $rawStore.shape;
            const pointsInSegment = shape[3]; // Last dimension is time samples
            
            // Get attributes from zarr group
            const attrs = await $zarrGroup.attrs.asObject();
            
            // Calculate total data size
            const rawDataElements = shape.reduce((a, b) => a * b, 1);
            const overviewElements = $overviewStore ? $overviewStore.shape.reduce((a, b) => a * b, 1) : 0;
            const totalElements = rawDataElements + overviewElements;
            const elementSizeBytes = 2; // int16 = 2 bytes
            const totalDataSize = totalElements * elementSizeBytes;
            
            // Update dataset info
            datasetInfo = {
                pointsInSegment: pointsInSegment,
                timeBetweenPoints: attrs.horiz_interval || 0,
                segmentLength: pointsInSegment * (attrs.horiz_interval || 0),
                totalDataSize: totalDataSize,
                url: $dataUrl
            };
        } catch (error) {
            console.error('Error calculating dataset info:', error);
        }
    }

    // Apply URL-based selection with fallback to first available
    function applyUrlSelection() {
        const urlSelection = UrlService.initializeSelectionFromUrl(channels, trcFiles, segments);
        
        // Set channel from URL or first available
        if (urlSelection.channel) {
            selectedChannel.set(urlSelection.channel);
        } else if (!$selectedChannel && channels.length > 0) {
            selectedChannel.set(channels[0]);
        }
        
        // Set TRC from URL or first available
        if (urlSelection.trc) {
            selectedTrc.set(urlSelection.trc);
        } else if (!$selectedTrc && trcFiles.length > 0) {
            selectedTrc.set(trcFiles[0]);
        }
        
        // Set segment from URL or first available
        if (urlSelection.segment) {
            selectedSegment.set(urlSelection.segment);
        } else if (!$selectedSegment && segments.length > 0) {
            selectedSegment.set(segments[0]);
        }
    }

    function handlePlotData() {
        goto(`${base}/visualization`);
    }
</script>

<svelte:head>
    <title>Data Selection - ZoomingOnline</title>
</svelte:head>

<LoadingState 
    isLoading={$isLoading}
    error={$error}
    showRetryButton={false}
    on:back={() => goto(`${base}/`)}
/>

{#if !$isLoading && !$error && !$isDataLoaded}
    <LoadingState 
        isLoading={false}
        error="No Data Loaded"
        errorTitle="No Data Loaded"
        loadingMessage="Please load a dataset first."
        showRetryButton={false}
        on:back={() => goto(`${base}/`)}
    />
{:else if !$isLoading && !$error && $isDataLoaded}
    <div class="container-center">
        <div class="selection-header">
            <div class="flex items-center gap-4">
                <h2>Data Selection</h2>
            </div>
            {#if $showCopyLink}
                <ShareButton />
            {/if}
        </div>

        {#if datasetInfo.url}
            <div class="dataset-info-wrapper">
                <DatasetInfo {datasetInfo} />
            </div>
        {/if}

        <SelectionForm 
            {channels}
            {trcFiles}
            {segments}
            bind:selectedChannel={$selectedChannel}
            bind:selectedTrc={$selectedTrc}
            bind:selectedSegment={$selectedSegment}
            isDataReadyForPlot={$isDataReadyForPlot}
            on:plot={handlePlotData}
            on:loadDifferent={() => goto(`${base}/`)}
        />
    </div>
{/if}

<style>
    .container-center {
        background: white;
        border-radius: var(--border-radius-lg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        padding: var(--padding-lg);
        margin-bottom: var(--padding-md);
    }

    .flex {
        display: flex;
    }

    .items-center {
        align-items: center;
    }

    .gap-4 {
        gap: 1rem;
    }

    .selection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--padding-lg);
        padding: 1.5rem;
        background: white;
        border-radius: var(--border-radius-lg);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border: 1px solid #e9ecef;
    }

    .selection-header h2 {
        margin: 0;
        color: var(--color-primary);
        font-size: 1.5rem;
        font-weight: 600;
    }

    .dataset-info-wrapper {
        margin: 1.5rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: var(--border-radius-md);
        border: 1px solid #e9ecef;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        .selection-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
            padding: 1rem;
        }

        .dataset-info-wrapper {
            margin: 1rem 0;
            padding: 0.75rem;
        }
    }
</style>
