<script>
    import { 
        isLoading, 
        error, 
        isDataLoaded,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        rawStore,
        isDataReadyForPlot,
        showCopyLink
    } from '../stores/appStore.js';
    import { populateSelectors } from '../utils/uiManager.js';
    import { push } from 'svelte-spa-router';

    let channels = [];
    let trcFiles = [];
    let segments = [];

    // Reactive statements
    $: if ($rawStore) {
        populateSelectors($rawStore).then(data => {
            channels = data.channels;
            trcFiles = data.trcFiles;
            segments = data.segments;
        });
    }

    // Show copy link when data is loaded
    $: if ($isDataLoaded) {
        showCopyLink.set(true);
    }

    function handlePlotData() {
        if ($isDataReadyForPlot) {
            push('/visualization');
        }
    }

    function handleGoBack() {
        push('/');
    }
</script>

<div class="selection-container">
    {#if $isLoading}
        <div class="loading">
            <p>Loading data selectors...</p>
        </div>
    {:else if $error}
        <div class="error">
            <h3>Error</h3>
            <p>{$error}</p>
            <button on:click={handleGoBack}>
                Try Again
            </button>
        </div>
    {:else if $isDataLoaded}
        <div class="navigation">
            <button class="back-button" on:click={handleGoBack}>
                ← Back to Data Input
            </button>
        </div>
        
        <h3>Select Data Parameters</h3>
        
        <div class="selection-controls">
            <div class="control">
                <label for="channel-select">Channel:</label>
                <select id="channel-select" bind:value={$selectedChannel}>
                    <option value="">Select Channel</option>
                    {#each channels as channel}
                        <option value={channel}>{channel}</option>
                    {/each}
                </select>
            </div>
            
            <div class="control">
                <label for="trc-select">TRC File:</label>
                <select id="trc-select" bind:value={$selectedTrc}>
                    <option value="">Select TRC File</option>
                    {#each trcFiles as trc}
                        <option value={trc}>{trc}</option>
                    {/each}
                </select>
            </div>
            
            <div class="control">
                <label for="segment-select">Segment:</label>
                <select id="segment-select" bind:value={$selectedSegment}>
                    <option value="">Select Segment</option>
                    {#each segments as segment}
                        <option value={segment}>{segment}</option>
                    {/each}
                </select>
            </div>
        </div>
        
        <button 
            class="plot-button"
            on:click={handlePlotData}
            disabled={!$isDataReadyForPlot}
        >
            Plot Selected Data
        </button>
    {/if}
</div>

<style>
    .selection-container {
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        text-align: center;
        margin-bottom: 1rem;
    }

    .navigation {
        display: flex;
        justify-content: flex-start;
        margin-bottom: 1rem;
    }

    .back-button {
        background-color: #6c757d;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .back-button:hover {
        background-color: #5a6268;
    }

    h3 {
        margin: 1rem 0;
        color: #333;
    }

    .plot-button {
        margin-top: 1rem;
    }

    .selection-controls {
        display: flex;
        gap: 1rem;
        align-items: end;
        justify-content: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .control {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }

    label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #333;
    }

    select {
        padding: 0.5rem;
        font-size: 1rem;
        border-radius: 5px;
        border: 1px solid #ccc;
        min-width: 150px;
    }

    button {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        color: #fff;
        background-color: #007bff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    button:hover:not(:disabled) {
        background-color: #0056b3;
    }

    button:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
    }

    .loading {
        padding: 2rem;
        color: #666;
        font-style: italic;
    }

    .error {
        padding: 2rem;
        color: #dc3545;
    }

    .error h3 {
        margin-top: 0;
        color: #dc3545;
    }

    .error button {
        background-color: #dc3545;
        margin-top: 1rem;
    }

    .error button:hover {
        background-color: #c82333;
    }

    @media (max-width: 768px) {        
        .selection-controls {
            flex-direction: column;
            align-items: center;
        }
    }
</style>
