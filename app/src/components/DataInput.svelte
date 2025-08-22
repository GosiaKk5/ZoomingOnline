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

<div class="p-6 bg-white rounded-lg shadow-lg text-center mb-6">
    <div class="mb-6 mt-6">
        <h3 class="px-4">Load Zarr Data - Enter full URL to your .zarr file</h3>
    </div>
    
    <div class="my-2 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
        <p class="m-0">For testing, try the example dataset:</p>
        <div class="flex gap-2 justify-center mt-2">
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
    
    <div class="w-full max-w-2xl mx-auto">
        <input 
            type="text" 
            class="form-control font-mono text-sm text-gray-900 bg-gray-50 border-2 border-gray-300 focus:border-blue-500 focus:bg-white w-full mb-4"
            bind:value={inputUrl}
            placeholder={placeholder || exampleUrl}
            onkeydown={handleKeyPress}
            disabled={isLoading}
        />
        <div class="flex justify-center">
            <button 
                class="btn-primary btn-sm flex items-center gap-2"
                onclick={handleLoadData}
                disabled={isLoading || !inputUrl.trim()}
            >
                <CloudDownload class="w-4 h-4"/>
                <span>{isLoading ? 'Loading...' : 'Load Data'}</span>
            </button>
        </div>
    </div>
</div>

