<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as d3 from 'd3';
    import { 
        appState,
        dataState,
        uiState,
        actions
    } from '../stores/appState';
    import { initializePlotData, createChartSVG, drawAxes, drawGridLines, drawArea } from '../renderers/chartRenderer';
    import type { PlotDataResult } from '../renderers/chartRenderer';

    // Component state
    let chartContainer: HTMLDivElement;
    let isInitialized = $state(false);
    let chartError = $state<string | null>(null);
    let plotData = $state<PlotDataResult | null>(null);

    // Reactive state
    let state = $derived($appState);
    let data = $derived($dataState);
    let ui = $derived($uiState);

    // Check if we have all required data for plotting
    let canInitialize = $derived(
        data.rawStore && 
        data.zarrGroup && 
        data.overviewStore && 
        state.selection.channelIndex !== null && 
        state.selection.trcIndex !== null && 
        state.selection.segmentIndex !== null &&
        !isInitialized
    );

    // Initialize chart when data is ready
    $effect(() => {
        if (!canInitialize || !chartContainer) return;

        initializeChart();
    });

    async function initializeChart() {
        try {
            chartError = null;
            
            // Get plot data from renderer
            plotData = await initializePlotData(
                data.rawStore,
                data.zarrGroup,
                data.overviewStore,
                state.selection.channelIndex!,
                state.selection.trcIndex!,
                state.selection.segmentIndex!
            );

            // Create chart visualization
            renderChart();
            
            isInitialized = true;
        } catch (error) {
            console.error('Error initializing chart:', error);
            chartError = error instanceof Error ? error.message : 'Unknown error occurred';
        }
    }

    function renderChart() {
        if (!plotData || !chartContainer) return;

        // Clear existing content
        chartContainer.innerHTML = '';

        // Chart dimensions
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const width = chartContainer.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        const fullWidth = width + margin.left + margin.right;
        const chartHeight = height + margin.top + margin.bottom;

        // Create SVG
        const svg = createChartSVG(
            chartContainer, 
            `Channel ${state.selection.channelIndex + 1} | TRC ${state.selection.trcIndex + 1} | Segment ${state.selection.segmentIndex + 1}`,
            margin,
            width,
            height,
            fullWidth,
            chartHeight
        );

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, plotData.total_time_s])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([plotData.globalYMin, plotData.globalYMax])
            .range([height, 0]);

        // Draw chart elements
        drawAxes(svg, xScale, yScale, "Time (s)", height, margin, width);
        drawGridLines(svg, xScale, yScale, width, height);

        // Draw overview data if available
        if (plotData.overviewData && plotData.overviewData.length > 0) {
            drawArea(
                svg,
                plotData.overviewData,
                xScale,
                yScale,
                (d) => d.time_s,
                (d) => d.min_mv,
                (d) => d.max_mv
            );
        }
    }

    // Handle window resize
    function handleResize() {
        if (isInitialized && plotData) {
            renderChart();
        }
    }

    onMount(() => {
        window.addEventListener('resize', handleResize);
    });

    onDestroy(() => {
        window.removeEventListener('resize', handleResize);
    });
</script>

<!-- Chart container -->
{#if ui.isLoading}
    <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-4 text-gray-600">Loading chart data...</span>
    </div>
{:else if chartError}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <p class="text-red-800 font-medium">Chart Error:</p>
        <p class="text-red-600 text-sm mt-1">{chartError}</p>
    </div>
{:else if ui.error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <p class="text-red-800 font-medium">Data Error:</p>
        <p class="text-red-600 text-sm mt-1">{ui.error}</p>
    </div>
{:else}
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800">
                Data Visualization
            </h2>
            <p class="text-sm text-gray-600 mt-1">
                Channel {state.selection.channelIndex + 1}, TRC {state.selection.trcIndex + 1}, Segment {state.selection.segmentIndex + 1}
            </p>
        </div>
        
        <div class="p-6">
            <div 
                bind:this={chartContainer}
                class="w-full min-h-[400px] bg-gray-50 rounded border"
            >
                {#if !isInitialized}
                    <div class="flex items-center justify-center h-full py-20">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p class="text-gray-500">Initializing chart...</p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}