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

<div class="input-container">
    <div class="mb-6 mt-6">
        <h3 class="px-4">Load Zarr Data - Enter full URL to your .zarr file</h3>
    </div>
    
    <div class="example-hint">
        <p>For testing, try the example dataset:</p>
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
            onkeypress={handleKeyPress}
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

<style>
    .input-container {
        padding: var(--padding-md);
        background: white;
        border-radius: var(--border-radius-lg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        text-align: center;
        margin-bottom: var(--padding-md);
    }

    .example-hint {
        margin: 0.5rem 0;
        padding: 0.75rem;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: var(--border-radius-sm);
        font-size: 0.875rem;
        color: var(--color-text-secondary);
    }

    .example-hint p {
        margin: 0;
    }
</style>