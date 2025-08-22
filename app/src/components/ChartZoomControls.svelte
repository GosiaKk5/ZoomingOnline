<script>
    import { createEventDispatcher } from 'svelte';
    import { generateZoomLevelsWithLabels } from '../utils/zoomLevels';
    
    // Props using Svelte 5 runes syntax
    let { timeBetweenPoints, segmentDuration, totalSamples, currentZoomPosition = 0 } = $props();

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
            
            // Select third item from the bottom (end) as the default
            let defaultIndex;
            
            if (zoomLevels.length <= 2) {
                defaultIndex = 0;
            } else {
                // Select third item from the bottom
                defaultIndex = zoomLevels.length - 3;
            }
            
            defaultLevel = zoomLevels[defaultIndex];
            
            if (defaultLevel) {
                selectedZoomLevel = defaultLevel.value;
                defaultSet = true;
                
                // Dispatch the initial zoom level to ensure the visualization shows the rectangle
                dispatch('zoomLevelChange', { zoomLevel: selectedZoomLevel, position: Math.floor(totalSamples / 2) });
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
            // Use current zoom position to maintain position during zoom change
            dispatch('zoomLevelChange', { zoomLevel: newZoomLevel, position: currentZoomPosition });
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
            // Use current zoom position to maintain position during zoom change
            dispatch('zoomLevelChange', { zoomLevel: newZoomLevel, position: currentZoomPosition });
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
        // Use current zoom position to maintain position during zoom change
        dispatch('zoomLevelChange', { zoomLevel: newLevel, position: currentZoomPosition });
    }
</script>

<div class="bg-white p-6 rounded-lg shadow-md min-w-[200px] max-w-[240px]">
    <h3 class="text-lg font-semibold text-gray-800 m-0 mb-4">Zoom Controls</h3>
    
    <!-- Control buttons -->
    <div class="flex gap-2 mb-6">
        <button 
            onclick={handleZoomReset} 
            title="Reset zoom"
            class="flex-1 p-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 hover:text-gray-700 hover:-translate-y-0.5 transition-all text-gray-600 text-xs cursor-pointer"
        >
            🔄 Reset
        </button>
        <button 
            onclick={handleReloadData} 
            title="Reload data"
            class="flex-1 p-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 hover:text-gray-700 hover:-translate-y-0.5 transition-all text-gray-600 text-xs cursor-pointer"
        >
            ♻️ Reload
        </button>
    </div>
    
    <!-- Zoom Level -->
    <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-700 m-0 mb-3">Zoom Level</h4>
        
        <div class="flex gap-2 mb-4">
            <button 
                onclick={handleZoomIn} 
                title="Zoom In"
                disabled={!canZoomIn}
                class="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all cursor-pointer {canZoomIn ? 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5' : 'bg-gray-400 cursor-not-allowed'}"
            >
                ➕ In
            </button>
            <button 
                onclick={handleZoomOut} 
                title="Zoom Out"
                disabled={!canZoomOut}
                class="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all cursor-pointer {canZoomOut ? 'bg-amber-500 hover:bg-amber-600 hover:-translate-y-0.5' : 'bg-gray-400 cursor-not-allowed'}"
            >
                ➖ Out
            </button>
        </div>
        
        <div class="mb-2">
            <label for="zoomSelect" class="block text-xs font-medium text-gray-600 mb-1">Time Span:</label>
            <select 
                id="zoomSelect"
                bind:value={selectedZoomLevel}
                onchange={handleDropdownChange}
                class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white cursor-pointer transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
                {#each zoomLevels as level}
                    <option value={level.value}>
                        {level.label}
                    </option>
                {/each}
            </select>
        </div>
        
        {#if selectedZoomLevel}
            <div class="p-2 bg-blue-50 text-blue-800 rounded-md text-xs text-center">
                Current: {zoomLevels.find(l => l.value === selectedZoomLevel)?.label || 'Custom'}
            </div>
        {/if}
    </div>

    {#if zoomLevels.length === 0}
        <div class="text-xs text-gray-600 text-center mt-4">
            No zoom levels available
        </div>
    {/if}
</div>

