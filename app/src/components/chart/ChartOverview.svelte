<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { ChartRenderService } from '../../services/chart/ChartRenderService';
    import type { OverviewDataPoint } from '../../services/chart/ChartDataService';

    // Props using Svelte 5 $props() with proper TypeScript typing
    const { 
        data,
        totalTime,
        totalSamples,
        globalYMin,
        globalYMax,
        zoomLevel = null,
        zoomPosition = 0
    }: {
        data: OverviewDataPoint[];
        totalTime: number;
        totalSamples: number;
        globalYMin: number;
        globalYMax: number;
        zoomLevel?: number | null;
        zoomPosition?: number; // Now represents sample index (integer)
    } = $props();

    // Event dispatcher for zoom position changes
    const dispatch = createEventDispatcher();

    // Local state using Svelte 5 runes
    let containerRef = $state<HTMLDivElement | undefined>(undefined);
    let renderService = $state<ChartRenderService | null>(null);
    let isInitialized = $state<boolean>(false);

    onMount(() => {
        if (containerRef) {
            renderService = new ChartRenderService(containerRef);
            isInitialized = true;
            
            // Set up resize callback
            renderService.setResizeCallback(() => {
                if (renderService) {
                    renderChart();
                }
            });
        }
        
        return () => {
            renderService?.destroy();
            renderService = null;
        };
    });

    // Re-render when any prop changes using Svelte 5 $effect
    $effect(() => {
        if (renderService && isInitialized && data && data.length > 0) {
            renderChart();
        }
    });

    function renderChart(): void {
        if (!renderService || !data || data.length === 0) return;

        renderService.renderOverview({
            data,
            totalTime,
            totalSamples,
            globalYMin,
            globalYMax,
            zoomLevel,
            zoomPosition,
            onZoomPositionChange: handleZoomPositionChange
        });
    }

    function handleZoomPositionChange(newPosition: number): void {
        dispatch('zoomPositionChange', { position: newPosition });
    }
</script>

<div 
    bind:this={containerRef} 
    class="flex-1 mb-4 bg-gray-50 rounded border min-h-[300px] h-full"
    role="img"
    aria-label="Overview chart showing full data range with zoom controls"
></div>

<style>
    /* Global D3 chart styles that can't be easily replaced with Tailwind */
    :global(.grid line) {
        stroke: theme(colors.gray.200);
        stroke-dasharray: 2,2;
        opacity: 0.7;
    }
    
    :global(.axis) {
        color: theme(colors.gray.500);
        font-size: 11px;
    }
    
    :global(.axis path),
    :global(.axis line) {
        stroke: theme(colors.gray.400);
    }
    
    :global(.area) {
        fill: theme(colors.blue.500);
        fill-opacity: 0.3;
        stroke: theme(colors.blue.500);
        stroke-width: 1.5px;
    }
</style>