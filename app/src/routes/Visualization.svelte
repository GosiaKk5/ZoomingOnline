<script>
    import { onMount } from 'svelte';
    import { 
        showPlotAnotherButton,
        isDataReadyForPlot,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        rawStore,
        overviewStore,
        plotConfig,
        timeSteps
    } from '../stores/appStore.js';
    import { push } from 'svelte-spa-router';
    
    import Charts from '../components/Charts.svelte';

    onMount(() => {
        console.log('🎬 Visualization component mounted');
        console.log('  - isDataReadyForPlot:', $isDataReadyForPlot);
        console.log('  - selectedChannel:', $selectedChannel);
        console.log('  - selectedTrc:', $selectedTrc);
        console.log('  - selectedSegment:', $selectedSegment);
        console.log('  - rawStore exists:', !!$rawStore);
        console.log('  - overviewStore exists:', !!$overviewStore);
        
        // Show plot another button when entering visualization mode
        showPlotAnotherButton.set(true);
        console.log('  - Plot another button enabled');

        return () => {
            console.log('🧹 Visualization component cleanup');
            showPlotAnotherButton.set(false);
        };
    });

    // Monitor store changes during visualization
    $: {
        console.log('📊 Store state update in Visualization:');
        console.log('  - plotConfig total_time_us:', $plotConfig?.total_time_us);
        console.log('  - plotConfig selectedChannelData length:', $plotConfig?.selectedChannelData?.length);
        console.log('  - plotConfig selectedTrcData length:', $plotConfig?.selectedTrcData?.length);
        console.log('  - plotConfig selectedSegmentData length:', $plotConfig?.selectedSegmentData?.length);
    }

    function handleGoBack() {
        console.log('⬅️ Going back to selection page');
        push('/selection');
    }

    // Redirect to selection if data is not ready
    $: if (!$isDataReadyForPlot) {
        console.log('🚨 Data not ready for plot, redirecting to selection');
        push('/selection');
    }
</script>

{#if $isDataReadyForPlot}
    <div class="visualization-container">
        <div class="navigation">
            <button class="back-button" on:click={handleGoBack}>
                ← Back to Selection
            </button>
            <div class="selection-info">
                <span class="info-label">Channel:</span>
                <span class="info-value">{$selectedChannel}</span>
                <span class="info-separator">|</span>
                <span class="info-label">TRC:</span>
                <span class="info-value">{$selectedTrc}</span>
                <span class="info-separator">|</span>
                <span class="info-label">Segment:</span>
                <span class="info-value">{$selectedSegment}</span>
            </div>
        </div>
        
        <Charts />
    </div>
{/if}

<style>
    .visualization-container {
        width: 100%;
    }

    .navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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

    .selection-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #495057;
    }

    .info-label {
        font-weight: 600;
        color: #343a40;
    }

    .info-value {
        color: #007bff;
        font-weight: 500;
    }

    .info-separator {
        color: #6c757d;
        margin: 0 0.25rem;
    }
</style>
