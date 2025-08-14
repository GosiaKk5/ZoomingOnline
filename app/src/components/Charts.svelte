<script>
    import { onMount, afterUpdate } from 'svelte';
    import { 
        plotConfig, 
        rawStore, 
        overviewStore, 
        zarrGroup, 
        lastChunkCache,
        selectedChannel,
        selectedTrc,
        selectedSegment
    } from '../stores/appStore.js';
    import { getZoomDomains } from '../utils/timeUtils.js';
    import { parseSelectedIndex } from '../utils/uiManager.js';
    import { 
        initializePlotData, 
        createChartSVG, 
        drawAxes, 
        drawGridLines, 
        drawArea, 
        addDragHandler,
        renderDetailChart,
        formatTimeDuration,
        getTimeUnitInfo
    } from '../utils/chartRenderer.js';
    import * as d3 from 'd3';

    // Chart container elements
    let overviewContainer;
    let zoom1Container;
    let zoom2Container;

    // Chart update parameters from parent
    export let zoom1Position = 50;
    export let zoom2Position = 50;
    export let zoom1WindowIndex = 0;
    export let zoom2WindowIndex = 0;

    // Event dispatchers for position changes from drag
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    let isInitialized = false;

    // Initialize plot when data is ready
    $: if ($rawStore && $zarrGroup && $overviewStore && 
           $selectedChannel && $selectedTrc && $selectedSegment && 
           !isInitialized) {
        initializePlot();
    }

    // Update charts when position or window changes
    $: if (isInitialized && $plotConfig.total_time_us > 0) {
        updateAllCharts();
    }

    async function initializePlot() {
        try {
            const channelIndex = parseSelectedIndex($selectedChannel);
            const trcIndex = parseSelectedIndex($selectedTrc);
            const segmentIndex = parseSelectedIndex($selectedSegment);

            if (channelIndex === null || trcIndex === null || segmentIndex === null) {
                return;
            }

            const config = await initializePlotData(
                $rawStore, 
                $zarrGroup, 
                $overviewStore, 
                channelIndex, 
                trcIndex, 
                segmentIndex
            );

            plotConfig.set(config);
            isInitialized = true;
        } catch (error) {
            console.error('Error initializing plot:', error);
        }
    }

    async function updateAllCharts() {
        if (!$plotConfig || !isInitialized) return;

        const { width, height, total_time_us, overviewData, globalYMin, globalYMax } = $plotConfig;
        
        // Calculate zoom domains
        const { zoom1Domain, zoom2Domain } = getZoomDomains(
            zoom1Position, 
            zoom1WindowIndex, 
            zoom2Position, 
            zoom2WindowIndex
        );

        // Draw Overview Chart
        await drawOverviewChart(zoom1Domain);
        
        // Draw Zoom 1 Chart
        await drawZoom1Chart(zoom1Domain, zoom2Domain);
        
        // Draw Zoom 2 Chart
        await drawZoom2Chart(zoom2Domain);
    }

    async function drawOverviewChart(zoom1Domain) {
        if (!overviewContainer || !$plotConfig) return;

        const { width, height, total_time_us, overviewData, globalYMin, globalYMax,
                margin, fullWidth, chartHeight } = $plotConfig;

        // Create scales
        const x0 = d3.scaleLinear().domain([0, total_time_us]).range([0, width]);
        const y0 = d3.scaleLinear().domain([globalYMin, globalYMax]).range([height, 0]).nice();

        // Create SVG
        const svg0 = createChartSVG(overviewContainer, "Overview", margin, width, height, fullWidth, chartHeight);
        
        // Draw chart elements
        drawArea(svg0, overviewData, x0, y0, d => d.time_us, d => d.min_mv, d => d.max_mv);
        drawAxes(svg0, x0, y0, "Time [µs]", height, margin, width);
        drawGridLines(svg0, x0, y0, width, height);
        
        // Add draggable zoom rectangle
        const zoomRect1 = svg0.append("rect")
            .attr("class", "zoom-rect-1")
            .attr("x", x0(zoom1Domain[0]))
            .attr("width", x0(zoom1Domain[1]) - x0(zoom1Domain[0]))
            .attr("y", 0)
            .attr("height", height);
        
        // Add drag behavior
        addDragHandler(zoomRect1, x0, width, (newPosition) => {
            dispatch('zoom1PositionDrag', { position: newPosition });
        });
    }

    async function drawZoom1Chart(zoom1Domain, zoom2Domain) {
        if (!zoom1Container || !$plotConfig) return;

        const zoom1Duration = zoom1Domain[1] - zoom1Domain[0];
        const { useNanoseconds } = getTimeUnitInfo(zoom1Duration);
        const zoom1Title = `Zoom 1: ${formatTimeDuration(zoom1Duration, useNanoseconds)} window`;

        // Render detail chart
        const svg1 = await renderDetailChart(
            zoom1Container,
            zoom1Domain,
            $plotConfig,
            $rawStore,
            $lastChunkCache,
            zoom1Title
        );

        // Add zoom2 rectangle to zoom1 chart
        const { width, height } = $plotConfig;
        const x1 = d3.scaleLinear().domain(zoom1Domain).range([0, width]);
        
        const zoomRect2 = svg1.append("rect")
            .attr("class", "zoom-rect-2")
            .attr("x", x1(zoom2Domain[0]))
            .attr("width", x1(zoom2Domain[1]) - x1(zoom2Domain[0]))
            .attr("y", 0)
            .attr("height", height);
        
        // Add drag behavior for zoom2 rectangle
        addDragHandler(zoomRect2, x1, width, (newPosition) => {
            dispatch('zoom2PositionDrag', { position: newPosition });
        });
    }

    async function drawZoom2Chart(zoom2Domain) {
        if (!zoom2Container || !$plotConfig) return;

        const zoom2Duration = zoom2Domain[1] - zoom2Domain[0];
        const { useNanoseconds } = getTimeUnitInfo(zoom2Duration);
        const zoom2Title = `Zoom 2: ${formatTimeDuration(zoom2Duration, useNanoseconds)} window`;

        // Render detail chart
        await renderDetailChart(
            zoom2Container,
            zoom2Domain,
            $plotConfig,
            $rawStore,
            $lastChunkCache,
            zoom2Title
        );
    }

    // Handle position updates from drag
    function handleZoom1PositionDrag(event) {
        zoom1Position = event.detail.position;
        dispatch('zoom1PositionChange', { position: zoom1Position });
    }

    function handleZoom2PositionDrag(event) {
        zoom2Position = event.detail.position;
        dispatch('zoom2PositionChange', { position: zoom2Position });
    }
</script>

<svelte:window on:zoom1PositionDrag={handleZoom1PositionDrag} on:zoom2PositionDrag={handleZoom2PositionDrag} />

{#if isInitialized && $plotConfig.total_time_us > 0}
    <div class="chart-container">
        <div bind:this={overviewContainer} class="chart" id="overview-chart"></div>
        <div bind:this={zoom1Container} class="chart" id="zoom1-chart"></div>
        <div bind:this={zoom2Container} class="chart" id="zoom2-chart"></div>
    </div>
{/if}

<style>
    .chart-container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .chart {
        margin-bottom: 2.5rem;
    }

    .chart:last-child {
        margin-bottom: 0;
    }

    /* Zoom rectangle styles */
    :global(.zoom-rect-1), :global(.zoom-rect-2) {
        cursor: move;
        pointer-events: all;
        transition: fill 0.1s, stroke-width 0.1s;
    }

    :global(.zoom-rect-1) {
        fill: rgba(220, 53, 69, 0.2);
        stroke: #dc3545;
        stroke-width: 1.5px;
        stroke-dasharray: 4, 2;
    }

    :global(.zoom-rect-1:hover) {
        fill: rgba(220, 53, 69, 0.25);
    }

    :global(.zoom-rect-1.dragging) {
        fill: rgba(220, 53, 69, 0.35);
        stroke-width: 2px;
        stroke-dasharray: none;
    }

    :global(.zoom-rect-2) {
        fill: rgba(0, 123, 255, 0.2);
        stroke: #007bff;
        stroke-width: 1.5px;
        stroke-dasharray: 4, 2;
    }

    :global(.zoom-rect-2:hover) {
        fill: rgba(0, 123, 255, 0.25);
    }

    :global(.zoom-rect-2.dragging) {
        fill: rgba(0, 123, 255, 0.35);
        stroke-width: 2px;
        stroke-dasharray: none;
    }

    :global(.loading-text) {
        font-size: 1rem;
        font-style: italic;
        fill: #888;
        text-anchor: middle;
    }
</style>
