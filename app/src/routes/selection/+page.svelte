<script>
    import { onMount, onDestroy } from 'svelte';
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
    } from '../../stores/index.ts';
    import { populateSelectors } from '../../utils/uiManager.ts';
    import ShareButton from '../../components/ShareButton.svelte';
    import DatasetInfo from '../../components/DatasetInfo.svelte';

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

    // Reactive statement to populate selectors when raw data is available
    $: if ($rawStore && !selectorsPopulated) {
        populateSelectors($rawStore).then(data => {
            channels = data.channels;
            trcFiles = data.trcFiles;
            segments = data.segments;
            selectorsPopulated = true; // Set flag to prevent re-population
            
            // Auto-select first available options if none are selected
            if (!$selectedChannel && channels.length > 0) {
                selectedChannel.set(channels[0]);
            }
            if (!$selectedTrc && trcFiles.length > 0) {
                selectedTrc.set(trcFiles[0]);
            }
            if (!$selectedSegment && segments.length > 0) {
                selectedSegment.set(segments[0]);
            }
        });
    }

    // Reset selectors when data changes 
    $: if (!$rawStore) {
        selectorsPopulated = false;
        channels = [];
        trcFiles = [];
        segments = [];
    }

    function handlePlotData() {
        goto(`${base}/visualization`);
    }

    // Auto-select first available options if none are selected
    onMount(() => {
        const unsubscribe = isDataReadyForPlot.subscribe(ready => {
            if (ready && !$selectedChannel && channels.length > 0) {
                selectedChannel.set(channels[0]);
            }
            if (ready && !$selectedTrc && trcFiles.length > 0) {
                selectedTrc.set(trcFiles[0]);
            }
            if (ready && !$selectedSegment && segments.length > 0) {
                selectedSegment.set(segments[0]);
            }
        });

        return () => {
            unsubscribe();
        };
    });
</script>

<svelte:head>
    <title>Data Selection - ZoomingOnline</title>
</svelte:head>

{#if $isLoading}
    <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading data...</p>
    </div>
{:else if $error}
    <div class="error-container">
        <h3>Error Loading Data</h3>
        <p>{$error}</p>
        <button class="btn-secondary" on:click={() => goto('/')}>
            ← Back to Home
        </button>
    </div>
{:else if !$isDataLoaded}
    <div class="no-data-container">
        <h3>No Data Loaded</h3>
        <p>Please load a dataset first.</p>
        <button class="btn-secondary" on:click={() => goto('/')}>
            ← Back to Home
        </button>
    </div>
{:else}
    <div class="container-center">
        <div class="selection-header">
            <h2>Data Selection</h2>
            {#if $showCopyLink}
                <ShareButton />
            {/if}
        </div>

        {#if datasetInfo.url}
            <DatasetInfo {datasetInfo} />
        {/if}

        <div class="selection-container">
            <div class="form-row">
                <div class="form-group">
                    <label for="channel-select">Channel:</label>
                    <select id="channel-select" bind:value={$selectedChannel} class="form-control">
                        <option value="">Select Channel</option>
                        {#each channels as channel}
                            <option value={channel}>{channel}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-group">
                    <label for="trc-select">TRC File:</label>
                    <select id="trc-select" bind:value={$selectedTrc} class="form-control">
                        <option value="">Select TRC File</option>
                        {#each trcFiles as trc}
                            <option value={trc}>{trc}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-group">
                    <label for="segment-select">Segment:</label>
                    <select id="segment-select" bind:value={$selectedSegment} class="form-control">
                        <option value="">Select Segment</option>
                        {#each segments as segment}
                            <option value={segment}>{segment}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <div class="action-row">
                <button 
                    class="btn-primary plot-button"
                    disabled={!$isDataReadyForPlot}
                    on:click={handlePlotData}
                >
                    Plot Selected Data
                </button>

                <button 
                    class="btn-secondary"
                    on:click={() => goto('/')}
                >
                    ← Load Different Dataset
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .loading-container, .error-container, .no-data-container {
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

    .container-center {
        background: white;
        border-radius: var(--border-radius-lg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        padding: var(--padding-lg);
        margin-bottom: var(--padding-md);
    }

    .selection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--padding-md);
        flex-wrap: wrap;
        gap: 1rem;
    }

    .selection-header h2 {
        margin: 0;
        color: var(--color-primary);
    }

    .selection-container {
        display: flex;
        flex-direction: column;
        gap: var(--padding-md);
    }

    .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--padding-sm);
    }

    .form-group {
        display: flex;
        flex-direction: column;
    }

    .form-group label {
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--color-text-secondary);
    }

    .action-row {
        display: flex;
        gap: var(--padding-sm);
        justify-content: center;
        flex-wrap: wrap;
    }

    .plot-button {
        font-size: 1.1rem;
        padding: 0.75rem 2rem;
        min-width: 200px;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        .selection-header {
            flex-direction: column;
            text-align: center;
        }
        
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .action-row {
            flex-direction: column;
            align-items: center;
        }
        
        .plot-button {
            width: 100%;
            max-width: 300px;
        }
    }
</style>
