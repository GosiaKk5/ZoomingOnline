<script lang="ts">
    import { generateZoomLevelsWithLabels } from '../utils/zoomLevels';
    import { ZoomService } from '../stores/index';
    import { ZoomIn, ZoomOut } from '@lucide/svelte';

    // Props using Svelte 5 runes syntax
    let { 
        timeBetweenPoints,
        segmentDuration,
        selectedZoomLevel = $bindable(),
        onZoomIn = () => {},
        onZoomOut = () => {},
        onZoomLevelChange = () => {}
    }: {
        timeBetweenPoints: number;
        segmentDuration: number;
        selectedZoomLevel?: number;
        onZoomIn?: (newLevel: number) => void;
        onZoomOut?: (newLevel: number) => void;
        onZoomLevelChange?: (newLevel: number) => void;
    } = $props();

    // Generate zoom levels with labels based on timing parameters
    const zoomLevelsWithLabels = $derived(
        timeBetweenPoints && segmentDuration 
            ? generateZoomLevelsWithLabels(timeBetweenPoints, segmentDuration) 
            : []
    );
    
    // Set default zoom level using centralized configuration
    $effect(() => {
        if (zoomLevelsWithLabels.length > 0 && selectedZoomLevel === undefined) {
            selectedZoomLevel = ZoomService.getDefaultZoomLevel(zoomLevelsWithLabels);
        }
    });
    
    const currentLevelIndex = $derived(
        selectedZoomLevel !== undefined 
            ? zoomLevelsWithLabels.findIndex(level => level.value === selectedZoomLevel)
            : -1
    );
    const canZoomIn = $derived(currentLevelIndex > 0);
    const canZoomOut = $derived(currentLevelIndex < zoomLevelsWithLabels.length - 1 && currentLevelIndex >= 0);
    
    function handleZoomIn() {
        if (canZoomIn && currentLevelIndex > 0) {
            const newLevel = zoomLevelsWithLabels[currentLevelIndex - 1]!.value;
            selectedZoomLevel = newLevel;
            onZoomIn(newLevel);
        }
    }

    function handleZoomOut() {
        if (canZoomOut && currentLevelIndex < zoomLevelsWithLabels.length - 1) {
            const newLevel = zoomLevelsWithLabels[currentLevelIndex + 1]!.value;
            selectedZoomLevel = newLevel;
            onZoomOut(newLevel);
        }
    }

    function handleDropdownChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const newLevel = parseFloat(target.value);
        selectedZoomLevel = newLevel;
        onZoomLevelChange(newLevel);
    }
</script>

<div class="bg-white p-4 rounded-lg shadow-md min-w-[140px] max-w-[180px] sm:min-w-[120px]">
    <div class="mb-3">
        <h3 class="text-sm font-semibold text-gray-800">Zoom Control</h3>
    </div>
    
    <!-- Zoom In/Out Buttons -->
    <div class="flex gap-2 mb-4">
        <button 
            class="zoom-btn-in"
            disabled={!canZoomIn}
            onclick={handleZoomIn}
            title="Zoom In (decrease time span)"
        >
            <div class="w-4 h-4">
                <ZoomIn />
            </div>
            In
        </button>
        
        <button 
            class="zoom-btn-out"
            disabled={!canZoomOut}
            onclick={handleZoomOut}
            title="Zoom Out (increase time span)"
        >
            <div class="w-4 h-4">
                <ZoomOut />
            </div>
            Out
        </button>
    </div>
    
    <!-- Zoom Level Dropdown -->
    <div>
        <label for="zoomLevelSelect" class="block text-xs font-medium text-gray-700 mb-1">
            Time Span:
        </label>
        <select 
            id="zoomLevelSelect"
            class="form-select text-sm w-full sm:text-[10px]"
            value={selectedZoomLevel}
            onchange={handleDropdownChange}
        >
            {#each zoomLevelsWithLabels as zoomLevel}
                <option value={zoomLevel.value}>
                    {zoomLevel.label}
                </option>
            {/each}
        </select>
    </div>
    
    {#if zoomLevelsWithLabels.length === 0}
        <div class="text-xs text-gray-500 mt-2">
            No zoom levels available
        </div>
    {/if}
</div>

