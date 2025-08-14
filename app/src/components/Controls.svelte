<script>
    import { plotConfig } from '../stores/appStore.js';
    import { updateZoom2SliderRange, formatTimeLabel } from '../utils/timeUtils.js';
    import { onMount, createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    // Control values - these should be props from parent
    export let zoom1Position = 50;
    export let zoom2Position = 50;
    export let zoom1WindowIndex = 0;
    export let zoom2WindowIndex = 0;

    console.log('🎛️ Controls component props received:');
    console.log('  - zoom1Position:', zoom1Position);
    console.log('  - zoom2Position:', zoom2Position);
    console.log('  - zoom1WindowIndex:', zoom1WindowIndex);
    console.log('  - zoom2WindowIndex:', zoom2WindowIndex);

    // Time step arrays
    let validTimeSteps = [];
    let validZoom2Steps = [];

    // Reactive statements
    $: if ($plotConfig.validTimeSteps) {
        validTimeSteps = $plotConfig.validTimeSteps;
        if (zoom1WindowIndex >= validTimeSteps.length) {
            zoom1WindowIndex = Math.max(0, validTimeSteps.length - 7);
        }
    }

    $: if ($plotConfig.validZoom2Steps) {
        validZoom2Steps = $plotConfig.validZoom2Steps;
        if (zoom2WindowIndex >= validZoom2Steps.length) {
            zoom2WindowIndex = Math.max(0, validZoom2Steps.length - 6);
        }
    }

    // Handle value changes
    function handleZoom1PositionChange() {
        dispatch('zoom1PositionChange', { 
            position: zoom1Position,
            windowIndex: zoom1WindowIndex
        });
    }

    function handleZoom2PositionChange() {
        dispatch('zoom2PositionChange', { 
            position: zoom2Position,
            windowIndex: zoom2WindowIndex
        });
    }

    function handleZoom1WindowChange() {
        // Update zoom2 slider range when zoom1 window changes
        validZoom2Steps = updateZoom2SliderRange(zoom1WindowIndex);
        
        dispatch('zoom1WindowChange', { 
            position: zoom1Position,
            windowIndex: zoom1WindowIndex
        });
    }

    function handleZoom2WindowChange() {
        dispatch('zoom2WindowChange', { 
            position: zoom2Position,
            windowIndex: zoom2WindowIndex
        });
    }

    // Initialize default values when component mounts
    onMount(() => {
        if (validTimeSteps.length > 0) {
            zoom1WindowIndex = Math.max(0, validTimeSteps.length - 7);
        }
        if (validZoom2Steps.length > 0) {
            zoom2WindowIndex = Math.max(0, validZoom2Steps.length - 6);
        }
    });
</script>

{#if $plotConfig.total_time_us > 0}
    <div class="controls">
        <!-- Zoom Level 1 Controls -->
        <div class="control-group control-group-1">
            <h4>Zoom Level 1 (Red)</h4>
            
            <div class="control-row">
                <label for="zoom1-pos">Position (%):</label>
                <input 
                    type="range" 
                    id="zoom1-pos"
                    bind:value={zoom1Position}
                    on:input={handleZoom1PositionChange}
                    min="0" 
                    max="100" 
                    step="1"
                />
                <span class="value-display">{zoom1Position}%</span>
            </div>
            
            <div class="control-row">
                <label for="zoom1-window">Window Size:</label>
                <div class="custom-slider-wrapper">
                    {#if validTimeSteps.length > 0}
                        <div class="custom-slider-container">
                            <div class="custom-slider-track"></div>
                            {#each validTimeSteps as step, index}
                                <button
                                    class="custom-slider-bullet"
                                    class:active={index === zoom1WindowIndex}
                                    style="left: {(index / (validTimeSteps.length - 1)) * 100}%"
                                    on:click={() => {
                                        zoom1WindowIndex = index;
                                        handleZoom1WindowChange();
                                    }}
                                    title={step.label}
                                >
                                </button>
                                {#if index === 0 || index === validTimeSteps.length - 1 || step.label.match(/^(1|10|100|1000) (ns|µs|ms)$/)}
                                    <div 
                                        class="custom-slider-label"
                                        style="left: {(index / (validTimeSteps.length - 1)) * 100}%"
                                    >
                                        {step.label}
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/if}
                </div>
                <span class="value-display">
                    {validTimeSteps[zoom1WindowIndex]?.label || ''}
                </span>
            </div>
        </div>

        <!-- Zoom Level 2 Controls -->
        <div class="control-group control-group-2">
            <h4>Zoom Level 2 (Blue)</h4>
            
            <div class="control-row">
                <label for="zoom2-pos">Position (%):</label>
                <input 
                    type="range" 
                    id="zoom2-pos"
                    bind:value={zoom2Position}
                    on:input={handleZoom2PositionChange}
                    min="0" 
                    max="100" 
                    step="1"
                />
                <span class="value-display">{zoom2Position}%</span>
            </div>
            
            <div class="control-row">
                <label for="zoom2-window">Window Size:</label>
                <div class="custom-slider-wrapper">
                    {#if validZoom2Steps.length > 0}
                        <div class="custom-slider-container">
                            <div class="custom-slider-track"></div>
                            {#each validZoom2Steps as step, index}
                                <button
                                    class="custom-slider-bullet"
                                    class:active={index === zoom2WindowIndex}
                                    style="left: {(index / (validZoom2Steps.length - 1)) * 100}%"
                                    on:click={() => {
                                        zoom2WindowIndex = index;
                                        handleZoom2WindowChange();
                                    }}
                                    title={step.label}
                                >
                                </button>
                                {#if index === 0 || index === validZoom2Steps.length - 1 || step.label.match(/^(1|10|100|1000) (ns|µs|ms)$/)}
                                    <div 
                                        class="custom-slider-label"
                                        style="left: {(index / (validZoom2Steps.length - 1)) * 100}%"
                                    >
                                        {step.label}
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/if}
                </div>
                <span class="value-display">
                    {validZoom2Steps[zoom2WindowIndex]?.label || ''}
                </span>
            </div>
        </div>
    </div>
{/if}

<style>
    .controls {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        margin-bottom: 2rem;
    }

    .control-group {
        margin-bottom: 1rem;
        border-left: 3px solid;
        padding-left: 1rem;
    }

    .control-group h4 {
        margin-top: 0;
        margin-bottom: 0.5rem;
    }

    .control-group-1 {
        border-color: #dc3545;
    }

    .control-group-2 {
        border-color: #007bff;
    }

    .control-row {
        display: grid;
        grid-template-columns: 100px 1fr 70px;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
    }

    input[type="range"] {
        width: 100%;
    }

    .value-display {
        text-align: right;
        font-weight: 500;
        min-width: 70px;
    }

    /* Custom Slider Styles */
    .custom-slider-wrapper {
        width: 100%;
        min-height: 50px;
    }

    .custom-slider-container {
        width: 100%;
        position: relative;
        height: 50px;
        display: flex;
        align-items: center;
        padding: 0 10px;
        margin: 8px 0;
    }

    .custom-slider-track {
        position: absolute;
        height: 3px;
        width: calc(100% - 20px);
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
        top: 15px;
    }

    .control-group-1 .custom-slider-track {
        background-color: rgba(220, 53, 69, 0.1);
    }

    .control-group-2 .custom-slider-track {
        background-color: rgba(0, 123, 255, 0.1);
    }

    .custom-slider-bullet {
        position: absolute;
        height: 12px;
        width: 12px;
        border-radius: 50%;
        background-color: #ccc;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transform: translateX(-50%);
        cursor: pointer;
        transition: transform 0.15s ease, background-color 0.2s ease, box-shadow 0.15s ease;
        top: 15px;
    }

    .custom-slider-bullet:hover {
        transform: translateX(-50%) scale(1.2);
        box-shadow: 0 2px 5px rgba(0,0,0,0.25);
    }

    .custom-slider-bullet.active {
        transform: translateX(-50%) scale(1.3);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 10;
    }

    .custom-slider-label {
        position: absolute;
        font-size: 9px;
        color: #666;
        transform: translateX(-50%);
        text-align: center;
        top: 30px;
        white-space: nowrap;
        font-weight: 500;
        pointer-events: none;
    }

    .custom-slider-bullet.active + .custom-slider-label {
        font-weight: 600;
        color: #333;
    }

    .control-group-1 .custom-slider-bullet {
        background-color: rgba(220, 53, 69, 0.3);
    }

    .control-group-1 .custom-slider-bullet.active {
        background-color: #dc3545;
    }

    .control-group-2 .custom-slider-bullet {
        background-color: rgba(0, 123, 255, 0.3);
    }

    .control-group-2 .custom-slider-bullet.active {
        background-color: #007bff;
    }
</style>
