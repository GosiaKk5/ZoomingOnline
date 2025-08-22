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

<div class="zoom-control bg-white p-4 rounded-lg shadow-md">
    <div class="zoom-control-header mb-3">
        <h3 class="text-sm font-semibold text-gray-800">Zoom Control</h3>
    </div>
    
    <!-- Zoom In/Out Buttons -->
    <div class="zoom-buttons flex gap-2 mb-4">
        <button 
            class="zoom-button zoom-in btn-sm"
            class:disabled={!canZoomIn}
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
            class="zoom-button zoom-out btn-sm"
            class:disabled={!canZoomOut}
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
    <div class="zoom-dropdown">
        <label for="zoomLevelSelect" class="block text-xs font-medium text-gray-700 mb-1">
            Time Span:
        </label>
        <select 
            id="zoomLevelSelect"
            class="zoom-select form-select text-sm w-full"
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

<style>
    .zoom-control {
        min-width: 140px;
        max-width: 180px;
    }
    
    .zoom-button {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.375rem 0.75rem;
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.75rem;
        font-weight: 500;
        flex: 1;
    }
    
    .zoom-button:hover:not(.disabled) {
        background-color: #2563eb;
        transform: translateY(-1px);
    }
    
    .zoom-button:active:not(.disabled) {
        transform: translateY(0);
    }
    
    .zoom-button.disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        opacity: 0.6;
    }
    
    .zoom-in {
        background-color: #10b981;
    }
    
    .zoom-in:hover:not(.disabled) {
        background-color: #059669;
    }
    
    .zoom-out {
        background-color: #f59e0b;
    }
    
    .zoom-out:hover:not(.disabled) {
        background-color: #d97706;
    }
    
    .zoom-select {
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        padding: 0.375rem;
        font-size: 0.75rem;
        background-color: white;
        cursor: pointer;
    }
    
    .zoom-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    
    /* Ensure responsive design */
    @media (max-width: 640px) {
        .zoom-control {
            min-width: 120px;
        }
        
        .zoom-button {
            padding: 0.25rem 0.5rem;
            font-size: 0.625rem;
        }
        
        .zoom-select {
            font-size: 0.625rem;
        }
    }
</style>