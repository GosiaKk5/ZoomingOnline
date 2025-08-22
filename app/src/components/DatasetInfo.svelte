<script lang="ts">
    import { formatTime, formatFileSize } from '../utils/mathUtils.ts';
    
    // Props using Svelte 5 $props() with proper TypeScript typing
    const { 
        datasetInfo 
    }: {
        datasetInfo: any;
    } = $props();
    
    // Helper function to safely format numbers
    function safeToLocaleString(value: any): string {
        return (value !== null && value !== undefined && !isNaN(value)) ? value.toLocaleString() : 'N/A';
    }
    
    // Helper function to safely format time
    function safeFormatTime(value: any): string {
        return (value !== null && value !== undefined && !isNaN(value)) ? formatTime(value) : 'N/A';
    }
    
    // Helper function to safely format file size
    function safeFormatFileSize(value: any): string {
        return (value !== null && value !== undefined && !isNaN(value)) ? formatFileSize(value) : 'N/A';
    }
</script>

{#if datasetInfo}
<div class="dataset-info bg-gray-50 border border-gray-200 rounded-md p-4 mb-6 text-left">
    <h4 class="m-0 mb-4 text-gray-800 text-base font-semibold text-center">Dataset Information</h4>
    <div class="grid gap-2 text-sm">
        <div class="grid grid-cols-2 items-center py-1 border-b border-gray-200 last:border-b-0">
            <span class="font-medium text-gray-600">Points per segment:</span>
            <span class="text-gray-800 font-mono text-right">{safeToLocaleString(datasetInfo.pointsInSegment)}</span>
        </div>
        <div class="grid grid-cols-2 items-center py-1 border-b border-gray-200 last:border-b-0">
            <span class="font-medium text-gray-600">Time between points:</span>
            <span class="text-gray-800 font-mono text-right">{safeFormatTime(datasetInfo.timeBetweenPoints)}</span>
        </div>
        <div class="grid grid-cols-2 items-center py-1 border-b border-gray-200 last:border-b-0">
            <span class="font-medium text-gray-600">Segment duration:</span>
            <span class="text-gray-800 font-mono text-right">{safeFormatTime(datasetInfo.segmentLength)}</span>
        </div>
        <div class="grid grid-cols-2 items-center py-1 border-b border-gray-200 last:border-b-0">
            <span class="font-medium text-gray-600">Total dataset size:</span>
            <span class="text-gray-800 font-mono text-right">{safeFormatFileSize(datasetInfo.totalDataSize)}</span>
        </div>
        <div class="grid grid-cols-2 items-center py-1">
            <span class="font-medium text-gray-600">Data source:</span>
            <span class="text-blue-600 font-mono text-right text-xs break-all" title={datasetInfo.url || 'N/A'}>
                {datasetInfo.url && datasetInfo.url.length > 60 ? '...' + datasetInfo.url.slice(-60) : (datasetInfo.url || 'N/A')}
            </span>
        </div>
    </div>
</div>
{/if}

