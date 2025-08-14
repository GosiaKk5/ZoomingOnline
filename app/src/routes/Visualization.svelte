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
    import { setupTimeSliders } from '../utils/timeUtils.js';
    import { push } from 'svelte-spa-router';
    
    import Controls from '../components/Controls.svelte';
    import Charts from '../components/Charts.svelte';

    // Control values for charts
    let zoom1Position = 50;
    let zoom2Position = 50;
    let zoom1WindowIndex = 0;
    let zoom2WindowIndex = 0;

    onMount(() => {
        console.log('🎬 Visualization component mounted');
        console.log('  - isDataReadyForPlot:', $isDataReadyForPlot);
        console.log('  - selectedChannel:', $selectedChannel);
        console.log('  - selectedTrc:', $selectedTrc);
        console.log('  - selectedSegment:', $selectedSegment);
        console.log('  - rawStore exists:', !!$rawStore);
        console.log('  - overviewStore exists:', !!$overviewStore);
        console.log('  - rawStore shape:', $rawStore?.shape);
        console.log('  - overviewStore shape:', $overviewStore?.shape);
        console.log('  - plotConfig:', $plotConfig);
        console.log('  - timeSteps length:', $timeSteps?.length);
        console.log('  - timeSteps sample:', $timeSteps?.slice(0, 5));
        
        // Show plot another button when entering visualization mode
        showPlotAnotherButton.set(true);
        console.log('  - Plot another button enabled');

        return () => {
            console.log('🧹 Visualization component cleanup');
            showPlotAnotherButton.set(false);
        };
    });

    // Call setupTimeSliders when plotConfig total_time_us becomes available
    $: if ($plotConfig?.total_time_us && $plotConfig.total_time_us > 0) {
        console.log('⏰ plotConfig total_time_us available, setting up time sliders');
        console.log('  - total_time_us:', $plotConfig.total_time_us);
        try {
            setupTimeSliders($plotConfig.total_time_us);
            console.log('✅ Time sliders setup completed');
        } catch (error) {
            console.error('❌ Error setting up time sliders:', error);
        }
    }

    // Monitor store changes during visualization
    $: {
        console.log('📊 Store state update in Visualization:');
        console.log('  - plotConfig total_time_us:', $plotConfig?.total_time_us);
        console.log('  - plotConfig overview_window_us:', $plotConfig?.overview_window_us);
        console.log('  - plotConfig zoom1_window_us:', $plotConfig?.zoom1_window_us);
        console.log('  - plotConfig zoom2_window_us:', $plotConfig?.zoom2_window_us);
        console.log('  - plotConfig selectedChannelData length:', $plotConfig?.selectedChannelData?.length);
        console.log('  - plotConfig selectedTrcData length:', $plotConfig?.selectedTrcData?.length);
        console.log('  - plotConfig selectedSegmentData length:', $plotConfig?.selectedSegmentData?.length);
    }

    // Handle control events from Controls component
    function handleZoom1PositionChange(event) {
        console.log('🎛️ Zoom1 position change:', event.detail.position);
        zoom1Position = event.detail.position;
    }

    function handleZoom2PositionChange(event) {
        console.log('🎛️ Zoom2 position change:', event.detail.position);
        zoom2Position = event.detail.position;
    }

    function handleZoom1WindowChange(event) {
        console.log('🎛️ Zoom1 window change:', event.detail);
        zoom1WindowIndex = event.detail.windowIndex;
        zoom1Position = event.detail.position;
    }

    function handleZoom2WindowChange(event) {
        console.log('🎛️ Zoom2 window change:', event.detail);
        zoom2WindowIndex = event.detail.windowIndex;
        zoom2Position = event.detail.position;
    }

    // Handle drag events from Charts component
    function handleZoom1PositionDrag(event) {
        console.log('🖱️ Zoom1 position drag:', event.detail.position);
        zoom1Position = event.detail.position;
    }

    function handleZoom2PositionDrag(event) {
        console.log('🖱️ Zoom2 position drag:', event.detail.position);
        zoom2Position = event.detail.position;
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
        </div>
        
        <Controls 
            bind:zoom1Position
            bind:zoom2Position  
            bind:zoom1WindowIndex
            bind:zoom2WindowIndex
            on:zoom1PositionChange={handleZoom1PositionChange}
            on:zoom2PositionChange={handleZoom2PositionChange}
            on:zoom1WindowChange={handleZoom1WindowChange}
            on:zoom2WindowChange={handleZoom2WindowChange}
        />
        
        <Charts 
            {zoom1Position}
            {zoom2Position}
            {zoom1WindowIndex}
            {zoom2WindowIndex}
            on:zoom1PositionChange={handleZoom1PositionDrag}
            on:zoom2PositionChange={handleZoom2PositionDrag}
        />
    </div>
{/if}

<style>
    .visualization-container {
        width: 100%;
    }

    .navigation {
        display: flex;
        justify-content: flex-start;
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
</style>
