<script>
    import { formatTime, formatFileSize } from '../utils/mathUtils.ts';
    
    // Use Svelte 5 runes mode for props
    const { datasetInfo } = $props();
    
    // Helper function to safely format numbers
    function safeToLocaleString(value) {
        return (value != null && !isNaN(value)) ? value.toLocaleString() : 'N/A';
    }
    
    // Helper function to safely format time
    function safeFormatTime(value) {
        return (value != null && !isNaN(value)) ? formatTime(value) : 'N/A';
    }
    
    // Helper function to safely format file size
    function safeFormatFileSize(value) {
        return (value != null && !isNaN(value)) ? formatFileSize(value) : 'N/A';
    }
</script>

{#if datasetInfo}
<div class="dataset-info">
    <h4>Dataset Information</h4>
    <div class="info-grid">
        <div class="info-item">
            <span class="info-label">Points per segment:</span>
            <span class="info-value">{safeToLocaleString(datasetInfo.pointsInSegment)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Time between points:</span>
            <span class="info-value">{safeFormatTime(datasetInfo.timeBetweenPoints)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Segment duration:</span>
            <span class="info-value">{safeFormatTime(datasetInfo.segmentLength)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Total dataset size:</span>
            <span class="info-value">{safeFormatFileSize(datasetInfo.totalDataSize)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Data source:</span>
            <span class="info-value info-url" title={datasetInfo.url || 'N/A'}>
                {datasetInfo.url && datasetInfo.url.length > 60 ? '...' + datasetInfo.url.slice(-60) : (datasetInfo.url || 'N/A')}
            </span>
        </div>
    </div>
</div>
{/if}

<style>
    .dataset-info {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        text-align: left;
    }

    .dataset-info h4 {
        margin: 0 0 1rem 0;
        color: #212529;
        font-size: 1rem;
        font-weight: 600;
        text-align: center;
    }

    .info-grid {
        display: grid;
        gap: 0.5rem;
        font-size: 0.875rem;
    }

    .info-item {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        padding: 0.25rem 0;
        border-bottom: 1px solid #e9ecef;
    }

    .info-item:last-child {
        border-bottom: none;
    }

    .info-label {
        font-weight: 500;
        color: #495057;
    }

    .info-value {
        color: #212529;
        font-family: 'Courier New', monospace;
        text-align: right;
    }

    .info-url {
        word-break: break-all;
        font-size: 0.75rem;
        color: #007bff;
    }
</style>