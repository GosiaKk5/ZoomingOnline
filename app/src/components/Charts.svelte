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
        plotActions,
        isLoading,
        error
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
    import ChartErrorBoundary from './ChartErrorBoundary.svelte';
    import * as d3 from 'd3';

    // Chart container elements - local component state
    let overviewContainer = $state<HTMLElement | undefined>(undefined);

    // Local component state using runes
    let isInitialized = $state(false);
    let currentDataVersion = $state(0);
    let chartError = $state<string | null>(null);
    let isDragging = $state(false);
    let wasRestoredFromUrl = $state(false);
    
    // Zoom control properties - local state
    let timeBetweenPoints = $state<number | undefined>(undefined);
    let segmentDuration = $state<number | undefined>(undefined);
    let selectedZoomLevel = $state<number | undefined>(undefined);

    // Derived state for reactive logic
    let shouldInitializePlot = $derived(
        $rawStore && $zarrGroup && $overviewStore && 
        $selectedChannel && $selectedTrc && $selectedSegment && 
        !isInitialized
    );
    
    let shouldUpdateOverviewChart = $derived(
        $plotConfig && overviewContainer && isInitialized
    );
    
    let shouldUpdateZoomRectangle = $derived(
        !isDragging && $plotConfig && overviewContainer && isInitialized && ($zoomPosition !== null || $zoomWidth !== null)
    );
    
    let shouldUpdateZoomControlParams = $derived(
        $plotConfig && $plotConfig.total_time_s && $plotConfig.horiz_interval
    );
    
    let shouldInitializeZoomWidth = $derived(
        selectedZoomLevel !== undefined && segmentDuration && $zoomWidth === null
    );
    
    let shouldResetForNewData = $derived(
        $dataVersion !== currentDataVersion
    );

    // Effects to handle reactive behaviors
    $effect(() => {
        if (shouldInitializePlot) {
            initializePlot();
        }
    });

    $effect(() => {
        if (shouldUpdateOverviewChart) {
            updateOverviewChart();
        }
    });
    
    $effect(() => {
        if (shouldUpdateZoomRectangle) {
            updateZoomRectangle();
        }
    });
    
    // Initialize selectedZoomLevel when zoom control params are available
    $effect(() => {
        console.log('🔍 Checking zoom level initialization:', {
            timeBetweenPoints,
            segmentDuration,
            selectedZoomLevel,
            hasPlotConfig: !!$plotConfig,
            plotConfigKeys: $plotConfig ? Object.keys($plotConfig) : []
        });
        
        if (timeBetweenPoints && segmentDuration && selectedZoomLevel === undefined) {
            const zoomLevelsWithLabels = generateZoomLevelsWithLabels(timeBetweenPoints, segmentDuration);
            console.log('🔍 Generated zoom levels:', zoomLevelsWithLabels);
            
            if (zoomLevelsWithLabels.length > 0) {
                const defaultZoomLevel = getDefaultZoomLevel(zoomLevelsWithLabels);
                console.log('🔍 Default zoom level:', defaultZoomLevel);
                
                if (defaultZoomLevel) {
                    selectedZoomLevel = defaultZoomLevel;
                    console.log('✅ Set selectedZoomLevel to:', selectedZoomLevel);
                    
                    // Only initialize default zoom if this is the very first initialization
                    // and position wasn't restored from URL
                    if (plotActions.initializeDefaultZoom && !wasRestoredFromUrl && $zoomPosition === 0) {
                        console.log('🎯 Initializing default zoom position (first time, no URL restore)');
                        plotActions.initializeDefaultZoom();
                    } else {
                        console.log('🔄 Skipping default zoom - already positioned:', {
                            wasRestoredFromUrl,
                            zoomPosition: $zoomPosition
                        });
                    }
                }
            }
        }
    });

    $effect(() => {
        if (shouldUpdateZoomControlParams) {
            const { total_time_s, horiz_interval } = $plotConfig;
            segmentDuration = total_time_s;
            timeBetweenPoints = horiz_interval;
            
            console.log('🔧 Zoom control params updated:', {
                segmentDuration,
                timeBetweenPoints,
                selectedZoomLevel
            });
            
            // Initialize selectedZoomLevel if not set
            if (selectedZoomLevel === undefined && timeBetweenPoints && segmentDuration) {
                const zoomLevelsWithLabels = generateZoomLevelsWithLabels(timeBetweenPoints, segmentDuration);
                if (zoomLevelsWithLabels.length > 0) {
                    const defaultZoomLevel = getDefaultZoomLevel(zoomLevelsWithLabels);
                    if (defaultZoomLevel) {
                        selectedZoomLevel = defaultZoomLevel;
                        console.log('🔧 Initialized selectedZoomLevel:', selectedZoomLevel);
                        
                        // Only initialize default zoom if this is the very first initialization
                        // and position wasn't restored from URL
                        if (plotActions.initializeDefaultZoom && !wasRestoredFromUrl && $zoomPosition === 0) {
                            console.log('🎯 Initializing default zoom position (first time, no URL restore)');
                            plotActions.initializeDefaultZoom();
                        } else {
                            console.log('🔄 Skipping default zoom - already positioned:', {
                                wasRestoredFromUrl,
                                zoomPosition: $zoomPosition
                            });
                        }
                    }
                }
            }
        }
    });
    
    $effect(() => {
        if (shouldInitializeZoomWidth) {
            // Convert default zoom level (time duration in seconds) to width percentage
            const defaultWidth = plotActions.convertZoomLevelToWidth(selectedZoomLevel!);
            if (defaultWidth !== null) {
                zoomWidth.set(defaultWidth);
            }
        }
    });
    
    $effect(() => {
        if (shouldResetForNewData) {
            // Reset local state for new data
            isInitialized = false;
            selectedZoomLevel = undefined;
            currentDataVersion = $dataVersion;
        }
    });
    
    async function initializePlot() {
        try {
            chartError = null; // Clear any previous errors
            
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
                wasRestoredFromUrl = true;
                console.log('🔄 Zoom state restored from URL parameters');
            } else {
                // No URL parameters - initialize with default (middle of plot)
                plotActions.initializeDefaultZoom();
            }
            
            isInitialized = true;
            
        } catch (error) {
            chartError = error instanceof Error ? error.message : 'Failed to initialize plot';
            console.error('Error initializing plot:', error);
        }
    }

    async function updateOverviewChart() {
        try {
            if (!overviewContainer) return;
            
            const { total_time_s, overviewData, globalYMin, globalYMax } = $plotConfig;
            
            // Get chart dimensions from centralized configuration
            const { margin, fullWidth, chartHeight } = $appConfig.chartConfig;
            const width = fullWidth - margin.left - margin.right;
            const height = chartHeight - margin.top - margin.bottom;

            if (!overviewData || overviewData.length === 0 || !width || !height || !margin) {
                throw new Error('No overview data or dimensions available for rendering');
            }

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
            chartError = error instanceof Error ? error.message : 'Failed to render chart';
            console.error('❌ Error in updateOverviewChart:', error);
        }
    }
    
    function updateZoomRectangle() {
        console.log('🔧 updateZoomRectangle called', {
            hasPlotConfig: !!$plotConfig,
            hasOverviewContainer: !!overviewContainer,
            zoomWidth: $zoomWidth,
            zoomPosition: $zoomPosition
        });
        
        if (!$plotConfig || !overviewContainer || $zoomWidth === null) return;
        
        const { total_time_s } = $plotConfig;
        
        // Get chart dimensions from centralized configuration
        const { margin, fullWidth, chartHeight } = $appConfig.chartConfig;
        const width = fullWidth - margin.left - margin.right;
        const height = chartHeight - margin.top - margin.bottom;
        
        // Type assertion for the SVG selection since we know the structure
        const svg0 = d3.select(overviewContainer).select("svg g") as d3.Selection<SVGGElement, unknown, null, undefined>;
        
        if (svg0.empty()) {
            console.log('🔧 SVG not found for zoom rectangle');
            return; // SVG not yet created
        }
        
        const x0 = d3.scaleLinear().domain([0, total_time_s]).range([0, width || 0]);
        
        // Redraw the zoom rectangle with updated position/width
        // Convert sample number to normalized position (0-1) for drawZoomRectangle
        const totalSamples = $plotConfig?.no_of_samples || 1000;
        const normalizedPosition = totalSamples > 1 ? $zoomPosition / (totalSamples - 1) : 0;
        
        console.log('🔧 Drawing zoom rectangle', {
            zoomPosition: $zoomPosition,
            normalizedPosition,
            zoomWidth: $zoomWidth,
            totalSamples,
            calculationCheck: {
                divider: totalSamples - 1,
                expected: `sample ${$zoomPosition} / ${totalSamples - 1} = ${normalizedPosition}`
            }
        });
        
        drawZoomRectangle(
            svg0, 
            x0, 
            height || 0, 
            normalizedPosition, 
            $zoomWidth as number, 
            total_time_s,
            (newNormalizedPosition: number) => {
                console.log('🖱️ Zoom rectangle dragged', {
                    newNormalizedPosition,
                    totalSamples
                });
                // Convert normalized position back to sample number
                const newSample = totalSamples > 1 ? Math.round(newNormalizedPosition * (totalSamples - 1)) : 0;
                plotActions.updateZoomPosition(newSample);
            },
            // Pass drag state callbacks
            () => {
                console.log('🖱️ Drag started');
                isDragging = true;
            },
            () => {
                console.log('🖱️ Drag ended');
                isDragging = false;
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

    function handleRetryChart() {
        chartError = null;
        isInitialized = false;
        // Trigger re-initialization
        if (shouldInitializePlot) {
            initializePlot();
        }
    }
</script>

<ChartErrorBoundary 
    chartName="Overview Chart"
    isLoading={$isLoading}
    hasDataError={Boolean($error)}
    onRetryChart={handleRetryChart}
>
    {#if isInitialized && $plotConfig.total_time_s > 0 && !chartError}
        <div class="bg-white p-8 rounded-lg shadow-md">
            <div class="overview-section flex gap-6">
                <!-- Overview Chart -->
                <div class="overview-chart-container flex-1">
                    <div bind:this={overviewContainer} id="overview-chart" class="mb-10"></div>
                </div>
                
                <!-- Zoom Control -->
                <div class="zoom-control-container">
                    {#if timeBetweenPoints && segmentDuration && selectedZoomLevel !== undefined}
                        <ZoomControl
                            {timeBetweenPoints}
                            {segmentDuration}
                            selectedZoomLevel={selectedZoomLevel}
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
    {:else if chartError}
        <!-- Local chart error display -->
        <div class="chart-error">
            <h3>Chart Error</h3>
            <p>{chartError}</p>
            <button onclick={handleRetryChart}>Retry</button>
        </div>
    {/if}
</ChartErrorBoundary>

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