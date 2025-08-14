<script>
    import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
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

    // Chart update parameters from parent - initialize with smart defaults based on dataset size
    export let zoom1Position = 50;
    export let zoom2Position = 50;
    export let zoom1WindowIndex = 0;  // Will be adjusted based on dataset
    export let zoom2WindowIndex = 0;  // Will be adjusted based on dataset

    // Ensure defaults are set
    $: if (zoom1Position === undefined) zoom1Position = 50;
    $: if (zoom2Position === undefined) zoom2Position = 50;
    $: if (zoom1WindowIndex === undefined) zoom1WindowIndex = 0;
    $: if (zoom2WindowIndex === undefined) zoom2WindowIndex = 0;

    // Smart default selection for small datasets
    $: if ($plotConfig && $plotConfig.validTimeSteps && $plotConfig.validTimeSteps.length > 0) {
        const validSteps = $plotConfig.validTimeSteps;
        const totalTime = $plotConfig.total_time_us;
        
        console.log('🎯 Smart default selection reactive statement triggered:');
        console.log('  - totalTime:', totalTime, 'µs');
        console.log('  - validSteps count:', validSteps.length);
        console.log('  - validSteps values:', validSteps.map(s => s.value_us + 'µs'));
        console.log('  - Current zoom1WindowIndex:', zoom1WindowIndex);
        
        // For very small datasets (< 100µs), choose a larger window index
        // For datasets < 50µs, use the largest available step
        // For datasets < 20µs, use the largest step (most zoomed out)
        let smartIndex;
        if (totalTime < 20) {
            // Very small dataset - use largest available window (most zoomed out)
            smartIndex = Math.max(0, validSteps.length - 1);
            console.log('  - Very small dataset (<20µs) - using largest window, index:', smartIndex);
        } else if (totalTime < 50) {
            // Small dataset - use 75% of the way to largest window
            smartIndex = Math.max(0, Math.floor(validSteps.length * 0.75));
            console.log('  - Small dataset (<50µs) - using 75% window, index:', smartIndex);
        } else if (totalTime < 100) {
            // Medium dataset - use 60% of the way to largest window
            smartIndex = Math.max(0, Math.floor(validSteps.length * 0.6));
            console.log('  - Medium dataset (<100µs) - using 60% window, index:', smartIndex);
        } else {
            // Larger dataset - use original 60% default
            smartIndex = Math.max(0, Math.floor(validSteps.length * 0.6));
            console.log('  - Large dataset (>=100µs) - using 60% window, index:', smartIndex);
        }
        
        console.log('  - Calculated smartIndex:', smartIndex);
        console.log('  - Selected step would be:', validSteps[smartIndex]);
        
        // Only update if we haven't set a custom value yet
        if (zoom1WindowIndex === 0 && smartIndex !== 0) {
            console.log('  - ✅ Updating zoom1WindowIndex from 0 to smart default:', smartIndex);
            console.log('  - Selected step:', validSteps[smartIndex]);
            zoom1WindowIndex = smartIndex;
        } else {
            console.log('  - ❌ Not updating zoom1WindowIndex:');
            console.log('    - Current zoom1WindowIndex:', zoom1WindowIndex);
            console.log('    - Calculated smartIndex:', smartIndex);
            console.log('    - Condition (zoom1WindowIndex === 0 && smartIndex !== 0):', 
                       (zoom1WindowIndex === 0 && smartIndex !== 0));
        }
    }

    const dispatch = createEventDispatcher();

    let isInitialized = false;

    // Component mount logging
    onMount(() => {
        console.log('🎬 Charts component mounted');
        console.log('  - rawStore exists:', !!$rawStore);
        console.log('  - zarrGroup exists:', !!$zarrGroup);
        console.log('  - overviewStore exists:', !!$overviewStore);
        console.log('  - selectedChannel:', $selectedChannel);
        console.log('  - selectedTrc:', $selectedTrc);
        console.log('  - selectedSegment:', $selectedSegment);
        console.log('  - plotConfig exists:', !!$plotConfig);
        console.log('  - isInitialized:', isInitialized);
    });

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
    $: if ($plotConfig && zoom1Position !== undefined && zoom1WindowIndex !== undefined && isInitialized) {
        console.log('🔄 Charts reactive update triggered:');
        console.log('  - plotConfig exists:', !!$plotConfig);
        console.log('  - plotConfig.validTimeSteps length:', $plotConfig.validTimeSteps?.length);
        console.log('  - zoom1Position:', zoom1Position, 'type:', typeof zoom1Position);
        console.log('  - zoom1WindowIndex:', zoom1WindowIndex, 'type:', typeof zoom1WindowIndex);
        console.log('  - zoom2Position:', zoom2Position, 'type:', typeof zoom2Position);
        console.log('  - zoom2WindowIndex:', zoom2WindowIndex, 'type:', typeof zoom2WindowIndex);
        console.log('  - isInitialized:', isInitialized);
        console.log('  - DOM elements exist check:');
        console.log('    - overviewContainer:', !!overviewContainer);
        console.log('    - zoom1Container:', !!zoom1Container);
        console.log('    - zoom2Container:', !!zoom2Container);
        
        // Only update charts if DOM elements are ready
        if (overviewContainer && zoom1Container && zoom2Container) {
            console.log('  - ✅ All DOM elements ready, calling updateAllCharts...');
            updateAllCharts(
                zoom1Position, 
                zoom1WindowIndex, 
                zoom2Position, 
                zoom2WindowIndex
            );
        } else {
            console.log('  - ⏳ DOM elements not ready yet, skipping chart update');
            console.log('    - Will retry when DOM elements are bound');
        }
    }    

    // Trigger chart update when DOM elements become available
    $: if (overviewContainer && zoom1Container && zoom2Container && $plotConfig && isInitialized) {
        console.log('🎯 DOM elements now available, triggering chart update:');
        console.log('  - overviewContainer ready:', !!overviewContainer);
        console.log('  - zoom1Container ready:', !!zoom1Container);
        console.log('  - zoom2Container ready:', !!zoom2Container);
        console.log('  - plotConfig ready:', !!$plotConfig);
        console.log('  - isInitialized:', isInitialized);
        
        updateAllCharts(
            zoom1Position, 
            zoom1WindowIndex, 
            zoom2Position, 
            zoom2WindowIndex
        );
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
        console.log('  - overviewData first point:', overviewData?.[0]);
        console.log('  - overviewData last point:', overviewData?.[overviewData?.length - 1]);
        console.log('  - globalYMin:', globalYMin, 'globalYMax:', globalYMax);
        console.log('  - margin:', margin);
        console.log('  - fullWidth:', fullWidth, 'chartHeight:', chartHeight);

        // Validate that we have overview data
        if (!overviewData || overviewData.length === 0) {
            console.error('❌ No overview data available for rendering');
            return;
        }

        try {
            // CRITICAL FIX: Overview chart should ALWAYS show the full data range
            // The x-axis domain should be from 0 to total_time_us, NOT the zoom domain
            console.log('📏 Creating scales for overview chart...');
            console.log('  - OVERVIEW X-AXIS DOMAIN: [0, ' + total_time_us + '] (FULL RANGE)');
            const x0 = d3.scaleLinear().domain([0, total_time_us]).range([0, width]);
            const y0 = d3.scaleLinear().domain([globalYMin, globalYMax]).range([height, 0]).nice();
            console.log('  - x0 domain (OVERVIEW FULL RANGE):', x0.domain(), 'range:', x0.range());
            console.log('  - y0 domain:', y0.domain(), 'range:', y0.range());
            console.log('  - Scale test - time 0 maps to x:', x0(0));
            console.log('  - Scale test - time', total_time_us, 'maps to x:', x0(total_time_us));

            // Create SVG
            console.log('🎯 Creating overview SVG...');
            const svg0 = createChartSVG(overviewContainer, "Overview", margin, width, height, fullWidth, chartHeight);
            console.log('  - Overview SVG created successfully');
            
            // Draw chart elements
            console.log('🎨 Drawing overview chart elements...');
            console.log('  - Drawing area chart with', overviewData.length, 'data points');
            console.log('  - Data time range:', overviewData[0]?.time_us, 'to', overviewData[overviewData.length - 1]?.time_us);
            console.log('  - Expected to cover full range: 0 to', total_time_us);
            
            // Ensure the overview data covers the full range
            const dataTimeRange = [
                Math.min(...overviewData.map(d => d.time_us)),
                Math.max(...overviewData.map(d => d.time_us))
            ];
            console.log('  - Actual data time range:', dataTimeRange);
            console.log('  - Data covers', ((dataTimeRange[1] - dataTimeRange[0]) / total_time_us * 100).toFixed(1), '% of total range');
            
            drawArea(svg0, overviewData, x0, y0, d => d.time_us, d => d.min_mv, d => d.max_mv);
            console.log('  - Area chart drawn successfully');
            
            // Draw axes and grid
            console.log('🎨 Drawing overview axes and grid...');
            drawAxes(svg0, x0, y0, "Time [µs]", height, margin, width);
            drawGridLines(svg0, x0, y0, width, height);
            console.log('  - Axes and grid drawn successfully');
            
            // Add draggable zoom rectangle - this shows the zoom1 window within the full overview
            console.log('🎨 Adding zoom1 rectangle to overview...');
            console.log('  - zoom1Domain for rectangle:', zoom1Domain);
            console.log('  - Rectangle x position:', x0(zoom1Domain[0]), 'width:', x0(zoom1Domain[1]) - x0(zoom1Domain[0]));
            console.log('  - Rectangle covers', ((zoom1Domain[1] - zoom1Domain[0]) / total_time_us * 100).toFixed(1), '% of overview');
            
            const zoomRect1 = svg0.append("rect")
                .attr("class", "zoom-rect-1")
                .attr("x", x0(zoom1Domain[0]))
                .attr("width", Math.max(1, x0(zoom1Domain[1]) - x0(zoom1Domain[0]))) // Ensure minimum width
                .attr("y", 0)
                .attr("height", height);
            
            console.log('  - Zoom1 rectangle added successfully');
            
            // Add drag behavior
            addDragHandler(zoomRect1, x0, width, (newPosition) => {
                dispatch('zoom1PositionDrag', { position: newPosition });
            });
            
            console.log('✅ Overview chart rendering completed successfully');
            
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
