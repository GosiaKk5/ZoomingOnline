<script>
    import { onMount } from 'svelte';
    import { 
        currentView, 
        dataUrl, 
        isDataReadyForPlot,
        showPlotAnotherButton,
        resetAppState
    } from './stores/appStore.js';
    import { generateTimeSteps, setupTimeSliders } from './utils/timeUtils.js';
    import { getUrlParams } from './utils/uiManager.js';
    
    // Import components
    import Header from './components/Header.svelte';
    import CopyLink from './components/CopyLink.svelte';
    import DataLoader from './components/DataLoader.svelte';
    import Controls from './components/Controls.svelte';
    import Charts from './components/Charts.svelte';

    // Control values for charts
    let zoom1Position = 50;
    let zoom2Position = 50;
    let zoom1WindowIndex = 0;
    let zoom2WindowIndex = 0;

    onMount(() => {
        // Generate time steps early
        generateTimeSteps();
        
        // Check if a data URL was provided in the query parameters
        const urlParams = getUrlParams();
        const urlDataParam = urlParams.get('data');
        
        if (urlDataParam) {
            // Set the data URL and show selection view
            dataUrl.set(urlDataParam);
            currentView.set('selection');
        } else {
            // Show input view
            currentView.set('input');
        }
    });

    // Handle view changes
    $: if ($currentView === 'visualization') {
        showPlotAnotherButton.set(true);
        
        // Setup time sliders when entering visualization mode
        // This will be called after plotConfig is initialized
        if ($isDataReadyForPlot) {
            // The actual setupTimeSliders call will happen in the Charts component
            // when it initializes the plot data
        }
    } else {
        showPlotAnotherButton.set(false);
    }

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
</script>

<main class="container">
    <Header />
    
    <CopyLink />
    
    <DataLoader />
    
    {#if $currentView === 'visualization'}
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
    {/if}
</main>

<style>
    :global(body) {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8f9fa;
        color: #333;
        margin: 0;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .container {
        width: 100%;
        max-width: 900px;
    }

    /* Global responsive styles */
    @media (max-width: 768px) {
        :global(body) {
            padding: 1rem;
        }
        
        .container {
            max-width: 100%;
        }
    }
</style>
