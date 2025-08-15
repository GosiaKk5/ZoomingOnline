<script>
    import { onMount } from 'svelte';
    import { 
        plotConfig, 
        rawStore, 
        overviewStore, 
        zarrGroup,
        selectedChannel,
        selectedTrc,
        selectedSegment
    } from '../stores/appStore.js';
    import { parseSelectedIndex } from '../utils/uiManager.js';
    import { 
        initializePlotData, 
        createChartSVG, 
        drawAxes, 
        drawGridLines, 
        drawArea
    } from '../utils/chartRenderer.js';
    import * as d3 from 'd3';

    // Chart container elements
    let overviewContainer;

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
        initializePlot();
    }

    // Update charts when plot config is ready
    $: if ($plotConfig && overviewContainer && isInitialized) {
        console.log('🔄 Charts reactive update triggered for overview');
        updateOverviewChart();
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
            console.log('  - config.overviewData length:', config.overviewData?.length);

            plotConfig.set(config);
            console.log('💾 Plot config updated in store');
            
            isInitialized = true;
            console.log('✅ Plot initialization completed');
            
        } catch (error) {
            console.error('❌ Error initializing plot:', error);
        }
    }

    async function updateOverviewChart() {
        console.log('🎨 updateOverviewChart() called');
        
        if (!$plotConfig || !isInitialized || !overviewContainer) {
            console.log('⚠️ Cannot update overview chart - missing requirements');
            return;
        }

        const { width, height, total_time_us, overviewData, globalYMin, globalYMax,
                margin, fullWidth, chartHeight } = $plotConfig;

        console.log('📊 Overview chart config:');
        console.log('  - total_time_us:', total_time_us);
        console.log('  - overviewData length:', overviewData?.length);

        if (!overviewData || overviewData.length === 0) {
            console.error('❌ No overview data available for rendering');
            return;
        }

        try {
            // Create scales for full overview
            const x0 = d3.scaleLinear().domain([0, total_time_us]).range([0, width]);
            const y0 = d3.scaleLinear().domain([globalYMin, globalYMax]).range([height, 0]).nice();

            // Create SVG
            const svg0 = createChartSVG(overviewContainer, "Overview", margin, width, height, fullWidth, chartHeight);
            
            // Draw chart elements
            drawArea(svg0, overviewData, x0, y0, d => d.time_us, d => d.min_mv, d => d.max_mv);
            drawAxes(svg0, x0, y0, "Time [µs]", height, margin, width);
            drawGridLines(svg0, x0, y0, width, height);
            
            console.log('✅ Overview chart rendering completed');
            
        } catch (error) {
            console.error('❌ Error in updateOverviewChart:', error);
        }
    }
</script>

{#if isInitialized && $plotConfig.total_time_us > 0}
    <div class="chart-container">
        <div bind:this={overviewContainer} class="chart" id="overview-chart"></div>
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
</style>
