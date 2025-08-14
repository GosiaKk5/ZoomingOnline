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

    // Ensure default values are properly set
    $: if (zoom1Position === undefined) zoom1Position = 50;
    $: if (zoom2Position === undefined) zoom2Position = 50;
    $: if (zoom1WindowIndex === undefined) zoom1WindowIndex = 0;
    $: if (zoom2WindowIndex === undefined) zoom2WindowIndex = 0;

    // Event dispatchers for position changes from drag
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    let isInitialized = false;

    // Initialize plot when data is ready
    $: if ($rawStore && $zarrGroup && $overviewStore && 
           $selectedChannel && $selectedTrc && $selectedSegment && 
           !isInitialized) {
        console.log('📊 Charts: All data ready, initializing plot...');
        console.log('  - rawStore shape:', $rawStore?.shape);
        console.log('  - zarrGroup exists:', !!$zarrGroup);
        console.log('  - overviewStore exists:', !!$overviewStore);
        console.log('  - selectedChannel:', $selectedChannel);
        console.log('  - selectedTrc:', $selectedTrc);
        console.log('  - selectedSegment:', $selectedSegment);
        console.log('  - isInitialized:', isInitialized);
        initializePlot();
    }

    // Update charts when position or window changes
    $: if (isInitialized && $plotConfig.total_time_us > 0) {
        updateAllCharts();
    }

    async function initializePlot() {
        try {
            console.log('🎯 Charts: initializePlot() called');
            
            const channelIndex = parseSelectedIndex($selectedChannel);
            const trcIndex = parseSelectedIndex($selectedTrc);
            const segmentIndex = parseSelectedIndex($selectedSegment);

            console.log('📊 Parsed indices:');
            console.log('  - channelIndex:', channelIndex);
            console.log('  - trcIndex:', trcIndex);
            console.log('  - segmentIndex:', segmentIndex);

            if (channelIndex === null || trcIndex === null || segmentIndex === null) {
                console.error('❌ Invalid indices - cannot initialize plot');
                return;
            }

            console.log('🔧 Calling initializePlotData...');
            const config = await initializePlotData(
                $rawStore, 
                $zarrGroup, 
                $overviewStore, 
                channelIndex, 
                trcIndex, 
                segmentIndex
            );

            console.log('✅ initializePlotData completed:');
            console.log('  - config.total_time_us:', config.total_time_us);
            console.log('  - config.no_of_samples:', config.no_of_samples);
            console.log('  - config.horiz_interval:', config.horiz_interval);
            console.log('  - config.overviewData length:', config.overviewData?.length);
            console.log('  - config.globalYMin:', config.globalYMin);
            console.log('  - config.globalYMax:', config.globalYMax);

            plotConfig.set(config);
            console.log('💾 Plot config updated in store');
            
            isInitialized = true;
            console.log('✅ Plot initialization completed');
            
        } catch (error) {
            console.error('❌ Error initializing plot:', error);
            console.error('  - Error stack:', error.stack);
        }
    }

    async function updateAllCharts() {
        console.log('🎨 updateAllCharts() called');
        console.log('  - plotConfig exists:', !!$plotConfig);
        console.log('  - isInitialized:', isInitialized);
        
        if (!$plotConfig || !isInitialized) {
            console.log('⚠️ Cannot update charts - plotConfig or not initialized');
            return;
        }

        console.log('📊 Extracting plot config values...');
        const { width, height, total_time_us, overviewData, globalYMin, globalYMax } = $plotConfig;
        
        console.log('📏 Chart dimensions from config:');
        console.log('  - width:', width, 'type:', typeof width, 'isValid:', !isNaN(width) && isFinite(width));
        console.log('  - height:', height, 'type:', typeof height, 'isValid:', !isNaN(height) && isFinite(height));
        console.log('  - total_time_us:', total_time_us, 'type:', typeof total_time_us, 'isValid:', !isNaN(total_time_us) && isFinite(total_time_us));
        console.log('  - overviewData length:', overviewData?.length);
        console.log('  - globalYMin:', globalYMin, 'isValid:', !isNaN(globalYMin) && isFinite(globalYMin));
        console.log('  - globalYMax:', globalYMax, 'isValid:', !isNaN(globalYMax) && isFinite(globalYMax));
        
        // Validate dimensions before proceeding
        if (isNaN(width) || isNaN(height) || !isFinite(width) || !isFinite(height)) {
            console.error('❌ Invalid chart dimensions detected, aborting chart update');
            console.error('  - width:', width, 'height:', height);
            return;
        }
        
        console.log('🔍 Calculating zoom domains...');
        console.log('  - zoom1Position:', zoom1Position, 'type:', typeof zoom1Position);
        console.log('  - zoom1WindowIndex:', zoom1WindowIndex, 'type:', typeof zoom1WindowIndex);
        console.log('  - zoom2Position:', zoom2Position, 'type:', typeof zoom2Position);
        console.log('  - zoom2WindowIndex:', zoom2WindowIndex, 'type:', typeof zoom2WindowIndex);
        
        // Calculate zoom domains
        const { zoom1Domain, zoom2Domain } = getZoomDomains(
            zoom1Position, 
            zoom1WindowIndex, 
            zoom2Position, 
            zoom2WindowIndex
        );
        
        console.log('📈 Calculated domains:');
        console.log('  - zoom1Domain:', zoom1Domain);
        console.log('  - zoom2Domain:', zoom2Domain);

        try {
            console.log('🎯 Drawing Overview Chart...');
            await drawOverviewChart(zoom1Domain);
            console.log('✅ Overview chart completed');
            
            console.log('🎯 Drawing Zoom 1 Chart...');
            await drawZoom1Chart(zoom1Domain, zoom2Domain);
            console.log('✅ Zoom 1 chart completed');
            
            console.log('🎯 Drawing Zoom 2 Chart...');
            await drawZoom2Chart(zoom2Domain);
            console.log('✅ Zoom 2 chart completed');
            
        } catch (error) {
            console.error('❌ Error updating charts:', error);
            console.error('  - Error stack:', error.stack);
        }
    }

    async function drawOverviewChart(zoom1Domain) {
        console.log('🎨 drawOverviewChart() called');
        console.log('  - overviewContainer exists:', !!overviewContainer);
        console.log('  - plotConfig exists:', !!$plotConfig);
        console.log('  - zoom1Domain:', zoom1Domain);
        
        if (!overviewContainer || !$plotConfig) {
            console.log('⚠️ Cannot draw overview chart - missing container or config');
            return;
        }

        const { width, height, total_time_us, overviewData, globalYMin, globalYMax,
                margin, fullWidth, chartHeight } = $plotConfig;

        console.log('📊 Overview chart config:');
        console.log('  - width:', width, 'height:', height);
        console.log('  - total_time_us:', total_time_us);
        console.log('  - overviewData length:', overviewData?.length);
        console.log('  - globalYMin:', globalYMin, 'globalYMax:', globalYMax);
        console.log('  - margin:', margin);
        console.log('  - fullWidth:', fullWidth, 'chartHeight:', chartHeight);

        try {
            // Create scales
            console.log('📏 Creating scales...');
            const x0 = d3.scaleLinear().domain([0, total_time_us]).range([0, width]);
            const y0 = d3.scaleLinear().domain([globalYMin, globalYMax]).range([height, 0]).nice();
            console.log('  - x0 domain:', x0.domain(), 'range:', x0.range());
            console.log('  - y0 domain:', y0.domain(), 'range:', y0.range());

            // Create SVG
            console.log('🎯 Creating SVG...');
            const svg0 = createChartSVG(overviewContainer, "Overview", margin, width, height, fullWidth, chartHeight);
            console.log('  - SVG created successfully');
            
            // Draw chart elements
            console.log('🎨 Drawing chart elements...');
            drawArea(svg0, overviewData, x0, y0, d => d.time_us, d => d.min_mv, d => d.max_mv);
            console.log('  - Area drawn');
            
            // Draw axes and grid
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
            
        } catch (error) {
            console.error('❌ Error in drawOverviewChart:', error);
            console.error('  - Error stack:', error.stack);
        }
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
