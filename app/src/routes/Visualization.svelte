<script>
    import { onMount } from 'svelte';
    import { 
        showPlotAnotherButton,
        isDataReadyForPlot
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
        // Show plot another button when entering visualization mode
        showPlotAnotherButton.set(true);
        
        // Setup time sliders when entering visualization mode
        if ($isDataReadyForPlot) {
            // The actual setupTimeSliders call will happen in the Charts component
            // when it initializes the plot data
        }

        return () => {
            // Clean up when leaving visualization mode
            showPlotAnotherButton.set(false);
        };
    });

    // Handle control events from Controls component
    function handleZoom1PositionChange(event) {
        zoom1Position = event.detail.position;
    }

    function handleZoom2PositionChange(event) {
        zoom2Position = event.detail.position;
    }

    function handleZoom1WindowChange(event) {
        zoom1WindowIndex = event.detail.windowIndex;
        zoom1Position = event.detail.position;
    }

    function handleZoom2WindowChange(event) {
        zoom2WindowIndex = event.detail.windowIndex;
        zoom2Position = event.detail.position;
    }

    // Handle drag events from Charts component
    function handleZoom1PositionDrag(event) {
        zoom1Position = event.detail.position;
    }

    function handleZoom2PositionDrag(event) {
        zoom2Position = event.detail.position;
    }

    function handleGoBack() {
        push('/selection');
    }

    // Redirect to selection if data is not ready
    $: if (!$isDataReadyForPlot) {
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
