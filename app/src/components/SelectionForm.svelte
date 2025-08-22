<script lang="ts">
    // Props using Svelte 5 $props() with proper TypeScript typing
    const { 
        channels = [],
        trcFiles = [],
        segments = [],
        selectedChannel = '',
        selectedTrc = '',
        selectedSegment = '',
        isDataReadyForPlot = false,
        onSelectionChange = () => {},
        onPlot = () => {},
        onLoadDifferent = () => {}
    }: {
        channels?: string[];
        trcFiles?: string[];
        segments?: string[];
        selectedChannel?: string;
        selectedTrc?: string;
        selectedSegment?: string;
        isDataReadyForPlot?: boolean;
        onSelectionChange?: (field: string, value: string) => void;
        onPlot?: () => void;
        onLoadDifferent?: () => void;
    } = $props();
    
    // Handle selection changes using runes callback pattern
    function handleChannelChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        onSelectionChange?.('channel', target.value);
    }
    
    function handleTrcChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        onSelectionChange?.('trc', target.value);
    }
    
    function handleSegmentChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        onSelectionChange?.('segment', target.value);
    }
    
    // Handle plot button click
    function handlePlotData(): void {
        onPlot?.();
    }
    
    // Handle load different dataset
    function handleLoadDifferent(): void {
        onLoadDifferent?.();
    }
</script>

<div class="flex flex-col gap-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="flex flex-col">
            <label for="channel-select" class="mb-2 font-semibold text-gray-600">Channel:</label>
            <select 
                id="channel-select" 
                value={selectedChannel} 
                onchange={handleChannelChange}
                class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
                <option value="">Select Channel</option>
                {#each channels as channel}
                    <option value={channel}>{channel}</option>
                {/each}
            </select>
        </div>

        <div class="flex flex-col">
            <label for="trc-select" class="mb-2 font-semibold text-gray-600">TRC File:</label>
            <select 
                id="trc-select" 
                value={selectedTrc} 
                onchange={handleTrcChange}
                class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
                <option value="">Select TRC File</option>
                {#each trcFiles as trc}
                    <option value={trc}>{trc}</option>
                {/each}
            </select>
        </div>

        <div class="flex flex-col">
            <label for="segment-select" class="mb-2 font-semibold text-gray-600">Segment:</label>
            <select 
                id="segment-select" 
                value={selectedSegment} 
                onchange={handleSegmentChange}
                class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
                <option value="">Select Segment</option>
                {#each segments as segment}
                    <option value={segment}>{segment}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="flex flex-col md:flex-row justify-center items-center gap-6 mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <button 
            class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none w-full md:w-auto max-w-xs"
            disabled={!isDataReadyForPlot}
            onclick={handlePlotData}
        >
            Plot Selected Data
        </button>

        <button 
            class="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 w-full md:w-auto max-w-xs"
            onclick={handleLoadDifferent}
        >
            ← Load Different Dataset
        </button>
    </div>
</div>

