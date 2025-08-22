<script lang="ts">
    import { onMount } from 'svelte';
    import { ChartRenderService } from '../../services/chart/ChartRenderService';
    import type { OverviewDataPoint } from '../../services/chart/ChartDataService';

    // Props using Svelte 5 $props() with proper TypeScript typing
    const { 
        data,
        totalTime,
        globalYMin,
        globalYMax 
    }: {
        data: OverviewDataPoint[];
        totalTime: number;
        globalYMin: number;
        globalYMax: number;
    } = $props();

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
            globalYMin,
            globalYMax
        });
    }
</script>

<div 
    bind:this={containerRef} 
    class="overview-chart h-40 mb-4 bg-gray-50 rounded border"
    role="img"
    aria-label="Overview chart showing full data range with zoom controls"
></div>

<style>
    .overview-chart {
        min-height: 160px;
    }
    
    .overview-chart :global(.zoom-rect) {
        fill: rgba(59, 130, 246, 0.2);
        stroke: #3b82f6;
        stroke-width: 2px;
        stroke-dasharray: 5, 5;
        cursor: move;
        transition: fill 0.2s ease;
    }
    
    .overview-chart :global(.zoom-rect:hover) {
        fill: rgba(59, 130, 246, 0.3);
    }
    
    .overview-chart :global(.zoom-rect.dragging) {
        fill: rgba(59, 130, 246, 0.4);
        stroke-width: 3px;
    }
    
    .overview-chart :global(.zoom-rect-hit-area) {
        fill: transparent;
        stroke: none;
        cursor: move;
    }
    
    .overview-chart :global(.grid line) {
        stroke: #e5e7eb;
        stroke-dasharray: 2,2;
        opacity: 0.7;
    }
    
    .overview-chart :global(.axis) {
        color: #6b7280;
        font-size: 11px;
    }
    
    .overview-chart :global(.axis path),
    .overview-chart :global(.axis line) {
        stroke: #9ca3af;
    }
    
    .overview-chart :global(.area) {
        fill: #3b82f6;
        fill-opacity: 0.3;
        stroke: #3b82f6;
        stroke-width: 1.5px;
    }
</style>