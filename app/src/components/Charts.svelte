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
    } from '../stores/appStore.ts';
    import { parseSelectedIndex } from '../utils/uiManager.ts';
    import { 
        initializePlotData, 
        createChartSVG, 
        drawAxes, 
        drawGridLines, 
        drawArea
    } from '../utils/chartRenderer.ts';
    import * as d3 from 'd3';

    // Chart container elements
    let overviewContainer;

    let isInitialized = false;

    // Component mount logging
    onMount(() => {
        // Charts component mounted
    });

    // Initialize plot when data is ready
    $: if ($rawStore && $zarrGroup && $overviewStore && 
           $selectedChannel && $selectedTrc && $selectedSegment && 
           !isInitialized) {
        initializePlot();
    }

    // Update charts when plot config is ready
    $: if ($plotConfig && overviewContainer && isInitialized) {
        updateOverviewChart();
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
            // Error initializing plot
        }
    }

    async function updateOverviewChart() {
        
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
        border-radius: var(--border-radius-lg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .chart {
        margin-bottom: 2.5rem;
    }

    .chart:last-child {
        margin-bottom: 0;
    }
</style>
