<script lang="ts">
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
    import ZoomControl from './ZoomControl.svelte';
    import * as d3 from 'd3';

    // Chart container elements
    let overviewContainer: HTMLElement;

    let isInitialized = false;
    
    // Zoom control properties - no defaults, will be set from data
    let timeBetweenPoints: number;
    let segmentDuration: number;
    let selectedZoomLevel: number | undefined;

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
    
    // Update zoom control parameters when plot config changes
    $: if ($plotConfig) {
        const { total_time_s, horiz_interval } = $plotConfig;
        if (total_time_s && horiz_interval) {
            segmentDuration = total_time_s;
            // Extract actual time between points from data
            timeBetweenPoints = horiz_interval;
        }
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

            // Store the complete config including all PlotDataResult fields
            plotConfig.set({
                ...config,
                selectedChannelData: null, // These will be set later if needed
                selectedTrcData: null,
                selectedSegmentData: null,
            });
            
            isInitialized = true;
            
        } catch (error) {
            // Error initializing plot
        }
    }

    async function updateOverviewChart() {
        
        const { width, height, total_time_s, overviewData, globalYMin, globalYMax,
                margin, fullWidth, chartHeight } = $plotConfig;

        if (!overviewData || overviewData.length === 0 || !width || !height || !margin) {
            console.error('❌ No overview data or dimensions available for rendering');
            return;
        }

        try {
            // Create scales for full overview
            const x0 = d3.scaleLinear().domain([0, total_time_s]).range([0, width]);
            const y0 = d3.scaleLinear().domain([globalYMin || 0, globalYMax || 0]).range([height, 0]).nice();

            // Create SVG
            const svg0 = createChartSVG(overviewContainer, "Overview", margin, width, height, fullWidth || width, chartHeight || height);
            
            // Draw chart elements
            drawArea(svg0, overviewData, x0, y0, (d: any) => d.time_s, (d: any) => d.min_mv, (d: any) => d.max_mv);
            drawAxes(svg0, x0, y0, "Time", height, margin, width);
            drawGridLines(svg0, x0, y0, width, height);
            
            console.log('✅ Overview chart rendering completed');
            
        } catch (error) {
            console.error('❌ Error in updateOverviewChart:', error);
        }
    }
    
    // Zoom control event handlers
    function handleZoomIn(newLevel: number) {
        selectedZoomLevel = newLevel;
        console.log('🔍 Zoom in to:', newLevel);
        // TODO: Implement actual zooming logic
    }
    
    function handleZoomOut(newLevel: number) {
        selectedZoomLevel = newLevel;
        console.log('🔍 Zoom out to:', newLevel);
        // TODO: Implement actual zooming logic
    }
    
    function handleZoomLevelChange(newLevel: number) {
        selectedZoomLevel = newLevel;
        console.log('🔍 Zoom level changed to:', newLevel);
        // TODO: Implement actual zooming logic
    }
</script>

{#if isInitialized && $plotConfig.total_time_s > 0}
    <div class="bg-white p-8 rounded-lg shadow-md">
        <div class="overview-section flex gap-6">
            <!-- Overview Chart -->
            <div class="overview-chart-container flex-1">
                <div bind:this={overviewContainer} id="overview-chart" class="mb-10"></div>
            </div>
            
            <!-- Zoom Control -->
            <div class="zoom-control-container">
                {#if timeBetweenPoints && segmentDuration}
                    <ZoomControl
                        {timeBetweenPoints}
                        {segmentDuration}
                        bind:selectedZoomLevel
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onZoomLevelChange={handleZoomLevelChange}
                    />
                {:else}
                    <div class="zoom-control bg-white p-4 rounded-lg shadow-md">
                        <div class="text-xs text-gray-500">
                            Loading zoom controls...
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .overview-section {
        align-items: flex-start;
    }
    
    .overview-chart-container {
        min-width: 0; /* Allow flex item to shrink */
    }
    
    .zoom-control-container {
        flex-shrink: 0; /* Don't shrink the zoom control */
    }
    
    @media (max-width: 768px) {
        .overview-section {
            flex-direction: column;
            gap: 1rem;
        }
    }
</style>