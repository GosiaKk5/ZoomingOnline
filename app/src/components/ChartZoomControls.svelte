<script>
    import { createEventDispatcher } from 'svelte';
    
    // Props using Svelte 5 runes syntax
    let { timeBetweenPoints = 1e-6, segmentDuration = 1 } = $props();

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // State using $state rune
    let selectedZoomLevel = $state();
    let zoomPosition = $state(50);

    // Simple zoom levels for testing
    const zoomLevels = [
        { value: 1, label: '1 second' },
        { value: 0.1, label: '100 ms' },
        { value: 0.01, label: '10 ms' },
        { value: 0.001, label: '1 ms' }
    ];

    // Functions
    function handleZoomIn() {
        console.log('Zoom In clicked');
        dispatch('zoomLevelChange', { zoomLevel: 0.01, position: 0.5 });
    }

    function handleZoomOut() {
        console.log('Zoom Out clicked');
        dispatch('zoomLevelChange', { zoomLevel: 1, position: 0.5 });
    }

    function handleZoomReset() {
        console.log('Zoom Reset clicked');
        dispatch('zoomReset');
    }

    function handleReloadData() {
        console.log('Reload Data clicked');
        dispatch('reloadData');
    }

    function handleDropdownChange(event) {
        const newLevel = parseFloat(event.target.value);
        selectedZoomLevel = newLevel;
        dispatch('zoomLevelChange', { zoomLevel: newLevel, position: zoomPosition / 100 });
    }

    function handlePositionChange(event) {
        zoomPosition = parseInt(event.target.value);
        if (selectedZoomLevel) {
            dispatch('zoomLevelChange', { zoomLevel: selectedZoomLevel, position: zoomPosition / 100 });
        }
    }
</script>

<div class="zoom-controls">
    <h3>Zoom Controls</h3>
    
    <!-- Control buttons -->
    <div class="control-buttons">
        <button on:click={handleZoomReset} title="Reset zoom">🔄 Reset</button>
        <button on:click={handleReloadData} title="Reload data">♻️ Reload</button>
    </div>
    
    <!-- Zoom Level -->
    <div class="zoom-level-section">
        <h4>Zoom Level</h4>
        
        <div class="zoom-buttons">
            <button on:click={handleZoomIn} title="Zoom In">🔍 In</button>
            <button on:click={handleZoomOut} title="Zoom Out">🔍 Out</button>
        </div>
        
        <div class="zoom-dropdown">
            <label for="zoomSelect">Time Span:</label>
            <select 
                id="zoomSelect"
                bind:value={selectedZoomLevel}
                on:change={handleDropdownChange}
            >
                <option value={undefined}>Overview</option>
                {#each zoomLevels as level}
                    <option value={level.value}>{level.label}</option>
                {/each}
            </select>
        </div>
        
        {#if selectedZoomLevel}
            <div class="current-zoom-info">
                Current: {zoomLevels.find(l => l.value === selectedZoomLevel)?.label || 'Custom'}
            </div>
        {/if}
    </div>

    <!-- Position Controls -->
    <div class="position-section">
        <h4>Position</h4>
        
        <div class="position-control">
            <label for="positionSlider">Position: {zoomPosition}%</label>
            <input
                id="positionSlider"
                type="range"
                min="0"
                max="100"
                step="1"
                bind:value={zoomPosition}
                on:input={handlePositionChange}
            />
            <div class="slider-labels">
                <span>Start</span>
                <span>Center</span>
                <span>End</span>
            </div>
        </div>
    </div>
    
    {#if zoomLevels.length === 0}
        <div class="no-zoom-message">
            No zoom levels available
        </div>
    {/if}
</div>

<style>
    .zoom-controls {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        min-width: 200px;
        max-width: 240px;
    }
    
    .zoom-controls h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
    }
    
    .zoom-controls h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }
    
    .control-buttons {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }
    
    .control-buttons button {
        flex: 1;
        padding: 0.5rem;
        background-color: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #6b7280;
        font-size: 0.75rem;
    }
    
    .control-buttons button:hover {
        background-color: #e5e7eb;
        color: #374151;
        transform: translateY(-1px);
    }
    
    .zoom-level-section {
        margin-bottom: 1.5rem;
    }
    
    .zoom-buttons {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .zoom-buttons button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.875rem;
        font-weight: 500;
        color: white;
    }
    
    .zoom-buttons button:first-child {
        background-color: #10b981;
    }
    
    .zoom-buttons button:first-child:hover {
        background-color: #059669;
        transform: translateY(-1px);
    }
    
    .zoom-buttons button:last-child {
        background-color: #f59e0b;
    }
    
    .zoom-buttons button:last-child:hover {
        background-color: #d97706;
        transform: translateY(-1px);
    }
    
    .zoom-dropdown {
        margin-bottom: 0.5rem;
    }
    
    .zoom-dropdown label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 0.25rem;
    }
    
    .zoom-dropdown select {
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        padding: 0.5rem;
        font-size: 0.875rem;
        background-color: white;
        cursor: pointer;
        transition: border-color 0.2s ease;
    }
    
    .zoom-dropdown select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .current-zoom-info {
        padding: 0.5rem;
        background-color: #dbeafe;
        color: #1d4ed8;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        text-align: center;
    }
    
    .position-control label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }
    
    .position-control input[type="range"] {
        width: 100%;
        height: 8px;
        border-radius: 5px;
        background: #d1d5db;
        outline: none;
        margin-bottom: 0.25rem;
    }
    
    .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #9ca3af;
    }
    
    .no-zoom-message {
        font-size: 0.75rem;
        color: #6b7280;
        text-align: center;
        margin-top: 1rem;
    }
    
    /* Responsive design */
    @media (max-width: 640px) {
        .zoom-controls {
            min-width: 180px;
        }
        
        .zoom-buttons button {
            padding: 0.375rem 0.75rem;
            font-size: 0.75rem;
        }
        
        .zoom-dropdown select {
            font-size: 0.75rem;
        }
    }
</style>