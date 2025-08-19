<script>
    import { createEventDispatcher } from 'svelte';
    
    // Props following Svelte 5 style
    export let channels = [];
    export let trcFiles = [];
    export let segments = [];
    export let selectedChannel = '';
    export let selectedTrc = '';
    export let selectedSegment = '';
    export let isDataReadyForPlot = false;
    
    // Event dispatcher for Svelte 5 compatibility
    const dispatch = createEventDispatcher();
    
    // Handle plot button click
    function handlePlotData() {
        dispatch('plot');
    }
    
    // Handle load different dataset
    function handleLoadDifferent() {
        dispatch('loadDifferent');
    }
</script>

<div class="selection-container">
    <div class="form-row">
        <div class="form-group">
            <label for="channel-select">Channel:</label>
            <select 
                id="channel-select" 
                bind:value={selectedChannel} 
                class="form-control"
            >
                <option value="">Select Channel</option>
                {#each channels as channel}
                    <option value={channel}>{channel}</option>
                {/each}
            </select>
        </div>

        <div class="form-group">
            <label for="trc-select">TRC File:</label>
            <select 
                id="trc-select" 
                bind:value={selectedTrc} 
                class="form-control"
            >
                <option value="">Select TRC File</option>
                {#each trcFiles as trc}
                    <option value={trc}>{trc}</option>
                {/each}
            </select>
        </div>

        <div class="form-group">
            <label for="segment-select">Segment:</label>
            <select 
                id="segment-select" 
                bind:value={selectedSegment} 
                class="form-control"
            >
                <option value="">Select Segment</option>
                {#each segments as segment}
                    <option value={segment}>{segment}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="action-row">
        <button 
            class="btn-primary btn-sm"
            disabled={!isDataReadyForPlot}
            on:click={handlePlotData}
        >
            Plot Selected Data
        </button>

        <button 
            class="btn-secondary btn-sm"
            on:click={handleLoadDifferent}
        >
            ← Load Different Dataset
        </button>
    </div>
</div>

<style>
    .selection-container {
        display: flex;
        flex-direction: column;
        gap: var(--padding-md);
    }

    .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--padding-sm);
    }

    .form-group {
        display: flex;
        flex-direction: column;
    }

    .form-group label {
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--color-text-secondary);
    }

    .action-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1.5rem;
        margin-top: 2rem;
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: var(--border-radius-lg);
        border: 1px solid #e9ecef;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .action-row {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
        }
        
        .action-row button {
            width: 100%;
            max-width: 280px;
        }
    }
</style>