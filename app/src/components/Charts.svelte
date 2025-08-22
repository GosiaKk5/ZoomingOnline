<script lang="ts">
    import { 
        appState,
        dataState,
        uiState
    } from '../stores/appState';
    import { initializePlotData } from '../renderers/chartRenderer';
    import { ChartDataService } from '../services/chart/ChartDataService';
    import ChartOverview from './chart/ChartOverview.svelte';
    import ChartDetail from './chart/ChartDetail.svelte';
    import ChartLoadingStates from './chart/ChartLoadingStates.svelte';
    import ChartZoomControls from './ChartZoomControls.svelte';
    import type { PlotDataResult } from '../renderers/chartRenderer';

    // Component state using Svelte 5 runes with proper TypeScript typing
    let plotData = $state<PlotDataResult | null>(null);
    let isInitialized = $state<boolean>(false);
    let chartError = $state<string | null>(null);

    // Local zoom state - no global store needed!
    let zoomLevel = $state<number | null>(null);
    let zoomPosition = $state<number>(0.5);

    // Derived values using Svelte 5 $derived with proper typing
    const state = $derived($appState);
    const data = $derived($dataState);
    const ui = $derived($uiState);

    const canInitialize = $derived<boolean>(
        data.rawStore !== null &&
        data.zarrGroup !== null &&
        data.overviewStore !== null &&
        state.selection.channelIndex !== null &&
        state.selection.trcIndex !== null &&
        state.selection.segmentIndex !== null &&
        typeof state.selection.channelIndex === 'number' &&
        typeof state.selection.trcIndex === 'number' &&
        typeof state.selection.segmentIndex === 'number' &&
        !isInitialized &&
        !chartError
    );

    const isZoomActive = $derived<boolean>(zoomLevel !== null && plotData !== null);
    
    const zoomDomain = $derived<{ startTime: number; endTime: number } | null>(() => {
        if (!isZoomActive || !plotData) return null;
        return ChartDataService.calculateZoomDomain(plotData.total_time_s, zoomLevel!, zoomPosition);
    });
    
    const detailData = $derived(() => {
        if (!plotData?.overviewData) return [];
        const domain = zoomDomain();
        if (!domain) return plotData.overviewData;
        return ChartDataService.filterDataByTimeRange(
            plotData.overviewData, 
            domain.startTime, 
            domain.endTime
        );
    });
    
    const chartTitle = $derived<string>(() => 
        ChartDataService.generateChartTitle(isZoomActive, zoomLevel ?? undefined)
    );
    
    const timeDomainForDetail = $derived<[number, number]>(() => {
        const domain = zoomDomain();
        if (domain) {
            return [domain.startTime, domain.endTime];
        }
        return plotData ? [0, plotData.total_time_s] : [0, 1];
    });
    
    const yDomainForCharts = $derived<[number, number]>(() => {
        if (!plotData) return [0, 1];
        return [plotData.globalYMin ?? 0, plotData.globalYMax ?? 1];
    });

    // Initialize when ready using $effect
    $effect(() => {
        if (canInitialize) {
            initializeChart();
        }
    });

    // Functions with improved error handling and proper typing
    async function initializeChart(): Promise<void> {
        if (isInitialized) return;
        
        try {
            console.log('Initializing chart with current selection');
            isInitialized = true;
            chartError = null;
            
            const result = await initializePlotData(
                data.rawStore,
                data.zarrGroup,
                data.overviewStore,
                state.selection.channelIndex!,
                state.selection.trcIndex!,
                state.selection.segmentIndex!
            );
            plotData = result;
            
            console.log('Chart initialized successfully', JSON.stringify({
                horiz_interval: plotData.horiz_interval,
                no_of_samples: plotData.no_of_samples,
                total_time_s: plotData.total_time_s,
                channel: plotData.channel,
                trc: plotData.trc,
                segment: plotData.segment,
                globalYMin: plotData.globalYMin,
                globalYMax: plotData.globalYMax,
                overviewDataLength: plotData.overviewData?.length
            }, null, 2));
        } catch (error) {
            console.error('Chart initialization failed:', error);
            chartError = error instanceof Error ? error.message : 'Unknown initialization error';
            isInitialized = false;
        }
    }

    // Optimized zoom handlers with proper TypeScript typing
    function handleZoomLevelChange(event: CustomEvent<{ zoomLevel: number; position: number }>): void {
        const { zoomLevel: newLevel, position } = event.detail;
        zoomLevel = newLevel;
        zoomPosition = position;
        console.log(`Zoom changed to level ${newLevel} at position ${position}`);
    }

    function handleZoomPositionChange(event: CustomEvent<{ position: number }>): void {
        zoomPosition = event.detail.position;
        console.log(`Zoom position changed to ${zoomPosition} via draggable rectangle`);
    }

    function handleZoomReset(): void {
        zoomLevel = null;
        zoomPosition = 0.5;
        console.log('Zoom reset to overview');
    }

    function handleReloadData(): void {
        console.log('Reloading chart data');
        plotData = null;
        isInitialized = false;
        chartError = null;
    }
</script>

<!-- Chart container -->
<ChartLoadingStates isLoading={$uiState.isLoading} error={$uiState.error || chartError} />

{#if !$uiState.isLoading && !$uiState.error && !chartError}
    <div class="flex gap-6">
        <!-- Chart Container -->
        <div class="flex-1 bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Data Visualization</h3>
                <div class="chart-area">
                    {#if !isInitialized || !plotData}
                        <ChartLoadingStates showInitializing={true} />
                    {:else}
                        <!-- Overview Chart -->
                        <ChartOverview
                            data={plotData.overviewData || []}
                            totalTime={plotData.total_time_s}
                            globalYMin={plotData.globalYMin ?? 0}
                            globalYMax={plotData.globalYMax ?? 1}
                            {zoomLevel}
                            {zoomPosition}
                            on:zoomPositionChange={handleZoomPositionChange}
                        />
                        
                        <!-- Detail Chart -->
                        <ChartDetail
                            data={detailData}
                            timeDomain={timeDomainForDetail}
                            yDomain={yDomainForCharts}
                            title={chartTitle}
                        />
                    {/if}
                </div>
            </div>
        </div>
        
        <!-- Zoom Controls -->
        {#if isInitialized && plotData}
            <div class="flex-shrink-0">
                <ChartZoomControls
                    timeBetweenPoints={plotData.horiz_interval || 1e-6}
                    segmentDuration={plotData.total_time_s}
                    on:zoomLevelChange={handleZoomLevelChange}
                    on:zoomReset={handleZoomReset}
                    on:reloadData={handleReloadData}
                />
            </div>
        {/if}
    </div>
{/if}

<style>
    .chart-area {
        min-height: 500px;
        padding: 1rem;
        background-color: #f9fafb;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }
</style>
