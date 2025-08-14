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
        isDataReadyForPlot,
        showCopyLink
    } from '../stores/appStore.js';
    import { populateSelectors } from '../utils/uiManager.js';
    import { push } from 'svelte-spa-router';

    let channels = [];
    let trcFiles = [];
    let segments = [];
    let selectorsPopulated = false; // Flag to prevent infinite loop

    onMount(() => {
        console.log('🎯 Selection component mounted');
        console.log('  - isDataLoaded:', $isDataLoaded);
        console.log('  - rawStore exists:', !!$rawStore);
        console.log('  - rawStore:', $rawStore);
        console.log('  - isLoading:', $isLoading);
        console.log('  - error:', $error);
        console.log('  - selectorsPopulated on mount:', selectorsPopulated);
    });

    // Reactive statements - only populate once when rawStore becomes available
    $: if ($rawStore && !selectorsPopulated) {
        console.log('📊 rawStore changed, populating selectors...');
        console.log('  - rawStore shape:', $rawStore?.shape);
        console.log('  - rawStore meta:', $rawStore?.meta);
        console.log('  - rawStore attrs:', $rawStore?.attrs);
        console.log('  - selectorsPopulated flag:', selectorsPopulated);
        
        selectorsPopulated = true; // Set flag to prevent re-population
        
        populateSelectors($rawStore).then(data => {
            console.log('✅ populateSelectors completed:');
            console.log('  - channels:', data.channels);
            console.log('  - trcFiles:', data.trcFiles);
            console.log('  - segments:', data.segments);
            
            channels = data.channels;
            trcFiles = data.trcFiles;
            segments = data.segments;
            
            console.log('🔧 Setting default values...');
            
            // Set default values to first available option if not already set
            if (channels.length > 0 && (!$selectedChannel || $selectedChannel === '')) {
                console.log('  - Setting default channel to:', channels[0]);
                selectedChannel.set(channels[0]);
            }
            if (trcFiles.length > 0 && (!$selectedTrc || $selectedTrc === '')) {
                console.log('  - Setting default trcFile to:', trcFiles[0]);
                selectedTrc.set(trcFiles[0]);
            }
            if (segments.length > 0 && (!$selectedSegment || $selectedSegment === '')) {
                console.log('  - Setting default segment to:', segments[0]);
                selectedSegment.set(segments[0]);
            }
            
            console.log('📋 Final selected values:');
            console.log('  - selectedChannel:', $selectedChannel);
            console.log('  - selectedTrc:', $selectedTrc);
            console.log('  - selectedSegment:', $selectedSegment);
            console.log('  - isDataReadyForPlot after setting defaults:', $isDataReadyForPlot);
        }).catch(err => {
            console.error('❌ Error in populateSelectors:');
            console.error('  - Error:', err);
            console.error('  - rawStore that failed:', $rawStore);
            selectorsPopulated = false; // Reset flag on error so user can retry
        });
    }

    // Show copy link when data is loaded
    $: if ($isDataLoaded) {
        console.log('🔗 Data loaded, showing copy link');
        showCopyLink.set(true);
    }

    // Monitor isDataReadyForPlot changes (only log when it becomes true)
    $: if ($isDataReadyForPlot) {
        console.log('✅ Data is ready for plot!');
        console.log('  - selectedChannel:', $selectedChannel);
        console.log('  - selectedTrc:', $selectedTrc);
        console.log('  - selectedSegment:', $selectedSegment);
    }

    function handlePlotData() {
        console.log('📈 Plot data button clicked');
        console.log('  - isDataReadyForPlot:', $isDataReadyForPlot);
        console.log('  - selectedChannel:', $selectedChannel);
        console.log('  - selectedTrc:', $selectedTrc);
        console.log('  - selectedSegment:', $selectedSegment);
        
        if ($isDataReadyForPlot) {
            console.log('🧭 Navigating to visualization...');
            push('/visualization');
        } else {
            console.log('⚠️ Data not ready for plot');
        }
    }

    function handleGoBack() {
        console.log('⬅️ Going back to home page');
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
                    {#each channels as channel}
                        <option value={channel}>{channel}</option>
                    {/each}
                </select>
            </div>
            
            <div class="control">
                <label for="trc-select">TRC File:</label>
                <select id="trc-select" bind:value={$selectedTrc}>
                    {#each trcFiles as trc}
                        <option value={trc}>{trc}</option>
                    {/each}
                </select>
            </div>
            
            <div class="control">
                <label for="segment-select">Segment:</label>
                <select id="segment-select" bind:value={$selectedSegment}>
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
