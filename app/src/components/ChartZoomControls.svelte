<script>
    import { createEventDispatcher } from 'svelte';
    import { generateZoomLevelsWithLabels } from '../utils/zoomLevels';
    
    // Props using Svelte 5 runes syntax
    let { timeBetweenPoints = 1e-6, segmentDuration = 1 } = $props();

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // State using $state rune
    let selectedZoomLevel = $state();
    let zoomPosition = $state(50);
    let defaultSet = $state(false);

    // Generate zoom levels dynamically based on data characteristics
    const zoomLevels = $derived(
        timeBetweenPoints && segmentDuration 
            ? generateZoomLevelsWithLabels(timeBetweenPoints, segmentDuration)
            : []
    );

    // Set default zoom level when zoom levels are available
    $effect(() => {
        if (zoomLevels.length > 0 && !defaultSet) {
            let defaultLevel;
            
            // First, try to find "1 µs" (1e-6 seconds) as the preferred default
            const preferredLevel = zoomLevels.find(level => {
                const is1us = Math.abs(level.value - 1e-6) < 1e-9; // 1 microsecond
                const labelMatch = level.label.includes('1 µs') || 
                                  level.label.includes('1 μs') ||
                                  level.label.includes('1 us');
                return is1us || labelMatch;
            });
            
            if (preferredLevel) {
                defaultLevel = preferredLevel;
            } else {
                // Fallback to original logic if 1µs not available
                let defaultIndex;
                
                if (zoomLevels.length <= 2) {
                    defaultIndex = 0;
                } else {
                    // Select third item from the bottom
                    defaultIndex = zoomLevels.length - 3;
                }
                
                defaultLevel = zoomLevels[defaultIndex];
            }
            
            if (defaultLevel) {
                selectedZoomLevel = defaultLevel.value;
                defaultSet = true;
                
                // Dispatch the initial zoom level to ensure the visualization shows the rectangle
                dispatch('zoomLevelChange', { zoomLevel: selectedZoomLevel, position: 0.5 });
            }
        }
    });

    // Derived state for button states
    const currentZoomIndex = $derived(
        selectedZoomLevel !== undefined 
            ? zoomLevels.findIndex(level => level.value === selectedZoomLevel)
            : -1
    );
    const canZoomIn = $derived(currentZoomIndex > 0);
    const canZoomOut = $derived(currentZoomIndex >= 0 && currentZoomIndex < zoomLevels.length - 1);

    // Functions
    function handleZoomIn() {
        console.log('Zoom In clicked');
        
        if (zoomLevels.length === 0) return;
        
        // Find current index in the zoom levels array
        const currentIndex = selectedZoomLevel !== undefined 
            ? zoomLevels.findIndex(level => level.value === selectedZoomLevel)
            : -1;
        
        // Move to a smaller zoom level (earlier in the array, more zoomed in)
        const newIndex = Math.max(0, currentIndex - 1);
        const newZoomLevel = zoomLevels[newIndex]?.value;
        
        if (newZoomLevel !== undefined) {
            selectedZoomLevel = newZoomLevel;
            dispatch('zoomLevelChange', { zoomLevel: newZoomLevel, position: 0.5 });
        }
    }

    function handleZoomOut() {
        console.log('Zoom Out clicked');
        
        if (zoomLevels.length === 0) return;
        
        // Find current index in the zoom levels array
        const currentIndex = selectedZoomLevel !== undefined 
            ? zoomLevels.findIndex(level => level.value === selectedZoomLevel)
            : -1;
        
        // Move to a larger zoom level (later in the array, more zoomed out)
        const newIndex = Math.min(zoomLevels.length - 1, currentIndex + 1);
        const newZoomLevel = zoomLevels[newIndex]?.value;
        
        if (newZoomLevel !== undefined) {
            selectedZoomLevel = newZoomLevel;
            dispatch('zoomLevelChange', { zoomLevel: newZoomLevel, position: 0.5 });
        }
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
</script>

<div class="zoom-controls">
    <h3>Zoom Controls</h3>
    
    <!-- Control buttons -->
    <div class="control-buttons">
        <button onclick={handleZoomReset} title="Reset zoom">🔄 Reset</button>
        <button onclick={handleReloadData} title="Reload data">♻️ Reload</button>
    </div>
    
    <!-- Zoom Level -->
    <div class="zoom-level-section">
        <h4>Zoom Level</h4>
        
        <div class="zoom-buttons">
            <button 
                onclick={handleZoomIn} 
                title="Zoom In"
                disabled={!canZoomIn}
                class:disabled={!canZoomIn}
            >
                ➕ In
            </button>
            <button 
                onclick={handleZoomOut} 
                title="Zoom Out"
                disabled={!canZoomOut}
                class:disabled={!canZoomOut}
            >
                ➖ Out
            </button>
        </div>
        
        <div class="zoom-dropdown">
            <label for="zoomSelect">Time Span:</label>
            <select 
                id="zoomSelect"
                bind:value={selectedZoomLevel}
                onchange={handleDropdownChange}
            >
                {#each zoomLevels as level}
                    <option value={level.value}>
                        {level.label}
                    </option>
                {/each}
            </select>
        </div>
        
        {#if selectedZoomLevel}
            <div class="current-zoom-info">
                Current: {zoomLevels.find(l => l.value === selectedZoomLevel)?.label || 'Custom'}
            </div>
        {/if}
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
    
    .zoom-buttons button.disabled,
    .zoom-buttons button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        transform: none;
    }
    
    .zoom-buttons button.disabled:hover,
    .zoom-buttons button:disabled:hover {
        background-color: #9ca3af;
        transform: none;
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