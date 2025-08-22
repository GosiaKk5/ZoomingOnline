<script lang="ts">
    import { CloudDownload } from '@lucide/svelte';
    
    // Props using Svelte 5 $props() with proper TypeScript typing
    let { 
        inputUrl = $bindable(''),
        exampleUrl = '',
        isLoading = false,
        placeholder = '',
        onload = () => {}
    }: {
        inputUrl?: string;
        exampleUrl?: string;
        isLoading?: boolean;
        placeholder?: string;
        onload?: (data: { url: string }) => void;
    } = $props();
    
    // Handle form submission
    function handleLoadData(): void {
        if (!inputUrl.trim()) {
            return;
        }
        onload?.({ url: inputUrl });
    }
    
    // Handle Enter key in input field
    function handleKeyPress(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            handleLoadData();
        }
    }
    
    // Copy example URL to input field (don't auto-load)
    function loadExample(): void {
        inputUrl = exampleUrl;
    }
    
    // Load example data directly
    function loadExampleData() {
        onload?.({ url: exampleUrl });
    }
</script>

<div class="p-8 md:p-6 bg-white rounded-xl shadow-lg text-center mb-6 max-w-7xl mx-auto">
    <div class="mb-8">
        <h2 class="text-2xl md:text-xl font-bold text-gray-800 mb-2">Load Zarr Data</h2>
        <p class="text-gray-600 text-sm md:text-xs">Enter the full URL to your .zarr file to begin analysis</p>
    </div>
    
    <div class="my-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p class="m-0 font-medium mb-3">For testing, try the example dataset:</p>
        <div class="flex gap-3 justify-center flex-wrap">
            <button 
                class="btn-secondary btn-sm" 
                onclick={loadExample}
                disabled={isLoading}
                title="Click to copy example URL to input field"
            >
                Copy Example URL
            </button>
            <button 
                class="btn-primary btn-sm" 
                onclick={loadExampleData}
                disabled={isLoading}
                title="Load example dataset directly"
            >
                Load Example Data
            </button>
        </div>
    </div>
    
    <div class="w-full max-w-5xl mx-auto space-y-4">
        <input 
            type="text" 
            class="form-control font-mono text-sm text-gray-900 bg-gray-50 border-2 border-gray-300 focus:border-blue-500 focus:bg-white w-full"
            bind:value={inputUrl}
            placeholder={placeholder || exampleUrl}
            onkeydown={handleKeyPress}
            disabled={isLoading}
        />
        <div class="flex justify-center">
            <button 
                class="btn-primary px-6 py-3 md:px-4 md:py-2 text-base md:text-sm flex items-center gap-2"
                onclick={handleLoadData}
                disabled={isLoading || !inputUrl.trim()}
            >
                <CloudDownload class="w-5 h-5 md:w-4 md:h-4"/>
                <span>{isLoading ? 'Loading...' : 'Load Data'}</span>
            </button>
        </div>
    </div>
</div>

