<script lang="ts">
    import { onMount } from 'svelte';
    import { ChartRenderService } from '../../services/chart/ChartRenderService';
    import type { OverviewDataPoint } from '../../services/chart/ChartDataService';

    // Props using Svelte 5 $props() with proper TypeScript typing
    const { 
        data,
        timeDomain,
        yDomain,
        title = 'Chart'
    }: {
        data: OverviewDataPoint[];
        timeDomain: [number, number];
        yDomain: [number, number];
        title?: string;
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

        renderService.renderDetail({
            data,
            timeDomain,
            yDomain,
            title
        });
    }
</script>

<div 
    bind:this={containerRef} 
    class="detail-chart h-80 bg-gray-50 rounded border"
    role="img"
    aria-label={`Detail chart: ${title}`}
></div>

<style>
    .detail-chart {
        min-height: 320px;
    }
    
    .detail-chart :global(.grid line) {
        stroke: #e5e7eb;
        stroke-dasharray: 2,2;
        opacity: 0.7;
    }
    
    .detail-chart :global(.axis) {
        color: #6b7280;
        font-size: 12px;
    }
    
    .detail-chart :global(.axis path),
    .detail-chart :global(.axis line) {
        stroke: #9ca3af;
    }
    
    .detail-chart :global(.area) {
        fill: #10b981;
        fill-opacity: 0.3;
        stroke: #10b981;
        stroke-width: 1.5px;
    }
    
    .detail-chart :global(text) {
        fill: #374151;
    }
</style>