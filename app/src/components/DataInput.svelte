<script>
    import { MdCloudDownload } from 'svelte-icons/md';
    import { createEventDispatcher } from 'svelte';
    
    // Props following Svelte 5 style
    export let inputUrl = '';
    export let exampleUrl = '';
    export let isLoading = false;
    export let placeholder = '';
    
    // Event dispatcher for Svelte 5 compatibility
    const dispatch = createEventDispatcher();
    
    // Handle form submission
    function handleLoadData() {
        if (!inputUrl.trim()) {
            return;
        }
        dispatch('load', { url: inputUrl });
    }
    
    // Handle Enter key in input field
    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            handleLoadData();
        }
    }
    
    // Copy example URL to input field (don't auto-load)
    function loadExample() {
        inputUrl = exampleUrl;
        // Just set the URL in the input field - don't automatically load
        // The user needs to click "Load Data" button manually
    }
</script>

<div class="input-container">
    <div class="mb-6 mt-6">
        <h3 class="px-4">Load Zarr Data - Enter full URL to your .zarr file</h3>
    </div>
    
    <div class="example-hint">
        <p>For testing, try the example dataset: 
            <button 
                class="btn-link" 
                on:click={loadExample}
                disabled={isLoading}
                title="Click to copy example URL to input field"
            >
                {exampleUrl}
            </button>
        </p>
    </div>
    
    <div class="w-full max-w-2xl mx-auto">
        <input 
            type="text" 
            class="form-control font-mono text-sm text-gray-900 bg-gray-50 border-2 border-gray-300 focus:border-blue-500 focus:bg-white w-full mb-4"
            bind:value={inputUrl}
            placeholder={placeholder || exampleUrl}
            on:keypress={handleKeyPress}
            disabled={isLoading}
        />
        <div class="flex justify-center">
            <button 
                class="btn-primary flex items-center gap-2"
                on:click={handleLoadData}
                disabled={isLoading || !inputUrl.trim()}
            >
                <div class="w-4 h-4">
                    <MdCloudDownload />
                </div>
                {isLoading ? 'Loading...' : 'Load Data'}
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