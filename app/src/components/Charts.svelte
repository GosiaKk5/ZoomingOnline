<script lang="ts">
    import { 
        plotConfig, 
        rawStore, 
        overviewStore, 
        zarrGroup,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        zoomPosition,
        zoomWidth,
        dataVersion,
        getDefaultZoomLevel,
        appConfig,
        plotActions
    } from '../stores/index';
    import { parseSelectedIndex } from '../utils/uiManager';
    import { 
        initializePlotData, 
        createChartSVG, 
        drawAxes, 
        drawGridLines, 
        drawArea,
        drawZoomRectangle
    } from '../renderers/chartRenderer';
    import { generateZoomLevelsWithLabels } from '../utils/zoomLevels';
    import ZoomControl from './ZoomControl.svelte';
    import * as d3 from 'd3';

    // Chart container elements
    let overviewContainer: HTMLElement;

    let isInitialized = false;
    let currentDataVersion = 0;
    
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
    
    // Update zoom rectangle when position or width changes
    $: if ($plotConfig && overviewContainer && isInitialized && ($zoomPosition || $zoomWidth !== null)) {
        updateZoomRectangle();
    }
    
    // Update zoom control parameters when plot config changes
    $: if ($plotConfig) {
        const { total_time_s, horiz_interval } = $plotConfig;
        if (total_time_s && horiz_interval) {
            segmentDuration = total_time_s;
            timeBetweenPoints = horiz_interval;
        }
    }
    
    // Initialize zoom width from default zoom level when zoom control is ready
    $: if (selectedZoomLevel !== undefined && segmentDuration && $zoomWidth === null) {
        // Convert default zoom level (time duration in seconds) to width percentage
        const defaultWidth = plotActions.convertZoomLevelToWidth(selectedZoomLevel);
        if (defaultWidth !== null) {
            zoomWidth.set(defaultWidth);
        }
    }
    
    // Reset component state when new data is loaded (detected by dataVersion change)
    $: if ($dataVersion !== currentDataVersion) {
        // Reset local state for new data
        isInitialized = false;
        selectedZoomLevel = undefined;
        currentDataVersion = $dataVersion;
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

            // Store the complete config
            plotConfig.set({
                ...config
            });
            
            // Try to restore zoom state from URL parameters
            const wasRestored = plotActions.restoreZoomFromUrl();
            if (wasRestored) {
                console.log('🔄 Zoom state restored from URL parameters');
            } else {
                // No URL parameters - initialize with default (middle of plot)
                plotActions.initializeDefaultZoom();
            }
            
            isInitialized = true;
            
        } catch (error) {
            // Error initializing plot
        }
    }

    async function updateOverviewChart() {
        
        const { total_time_s, overviewData, globalYMin, globalYMax } = $plotConfig;
        
        // Get chart dimensions from centralized configuration
        const { margin, fullWidth, chartHeight } = $appConfig.chartConfig;
        const width = fullWidth - margin.left - margin.right;
        const height = chartHeight - margin.top - margin.bottom;

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
            
            // Draw the zoom rectangle - initialize with default if needed
            let currentZoomWidth = $zoomWidth;
            if (currentZoomWidth === null && segmentDuration && timeBetweenPoints) {
                // Calculate default width using centralized configuration
                const zoomLevelsWithLabels = generateZoomLevelsWithLabels(timeBetweenPoints, segmentDuration);
                if (zoomLevelsWithLabels.length > 0) {
                    const defaultZoomLevel = getDefaultZoomLevel(zoomLevelsWithLabels);
                    if (defaultZoomLevel) {
                        const defaultWidth = plotActions.convertZoomLevelToWidth(defaultZoomLevel);
                        currentZoomWidth = defaultWidth ?? null;
                        
                        // Set the store value so it's consistent
                        if (currentZoomWidth !== null) {
                            zoomWidth.set(currentZoomWidth);
                        }
                    }
                }
            }
            
            if (currentZoomWidth !== null) {
                // Convert sample number to normalized position (0-1) for drawZoomRectangle
                const totalSamples = $plotConfig?.no_of_samples || 1000;
                const normalizedPosition = totalSamples > 1 ? $zoomPosition / (totalSamples - 1) : 0;
                drawZoomRectangle(
                    svg0, 
                    x0, 
                    height, 
                    normalizedPosition, 
                    currentZoomWidth as number, 
                    total_time_s,
                    (newNormalizedPosition: number) => {
                        // Convert normalized position back to sample number
                        const newSample = totalSamples > 1 ? Math.round(newNormalizedPosition * (totalSamples - 1)) : 0;
                        plotActions.updateZoomPosition(newSample);
                    }
                );
            }
            
            console.log('✅ Overview chart rendering completed');
            
        } catch (error) {
            console.error('❌ Error in updateOverviewChart:', error);
        }
    }
    
    function updateZoomRectangle() {
        if (!$plotConfig || !overviewContainer || $zoomWidth === null) return;
        
        const { total_time_s } = $plotConfig;
        
        // Get chart dimensions from centralized configuration
        const { margin, fullWidth, chartHeight } = $appConfig.chartConfig;
        const width = fullWidth - margin.left - margin.right;
        const height = chartHeight - margin.top - margin.bottom;
        
        // Type assertion for the SVG selection since we know the structure
        const svg0 = d3.select(overviewContainer).select("svg g") as d3.Selection<SVGGElement, unknown, null, undefined>;
        
        if (svg0.empty()) return; // SVG not yet created
        
        const x0 = d3.scaleLinear().domain([0, total_time_s]).range([0, width || 0]);
        
        // Redraw the zoom rectangle with updated position/width
        // Convert sample number to normalized position (0-1) for drawZoomRectangle
        const totalSamples = $plotConfig?.no_of_samples || 1000;
        const normalizedPosition = totalSamples > 1 ? $zoomPosition / (totalSamples - 1) : 0;
        drawZoomRectangle(
            svg0, 
            x0, 
            height || 0, 
            normalizedPosition, 
            $zoomWidth as number, 
            total_time_s,
            (newNormalizedPosition: number) => {
                // Convert normalized position back to sample number
                const newSample = totalSamples > 1 ? Math.round(newNormalizedPosition * (totalSamples - 1)) : 0;
                plotActions.updateZoomPosition(newSample);
            }
        );
    }
    
    // Zoom control event handlers
    function handleZoomIn(newLevel: number) {
        selectedZoomLevel = newLevel;
        console.log('🔍 Zoom in to:', newLevel);
    // Convert zoom level (time duration in seconds) to width percentage
    const newWidth = plotActions.convertZoomLevelToWidth(newLevel);
    if (newWidth !== null) plotActions.updateZoomWidth(newWidth);
    }
    
    function handleZoomOut(newLevel: number) {
        selectedZoomLevel = newLevel;
        console.log('🔍 Zoom out to:', newLevel);
    // Convert zoom level (time duration in seconds) to width percentage
    const newWidth = plotActions.convertZoomLevelToWidth(newLevel);
    if (newWidth !== null) plotActions.updateZoomWidth(newWidth);
    }
    
    function handleZoomLevelChange(newLevel: number) {
        selectedZoomLevel = newLevel;
        console.log('🔍 Zoom level changed to:', newLevel);
    // Convert zoom level (time duration in seconds) to width percentage
    const newWidth = plotActions.convertZoomLevelToWidth(newLevel);
    if (newWidth !== null) plotActions.updateZoomWidth(newWidth);
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