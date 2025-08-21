<script lang="ts">
    // Use a simple SVG instead of the missing icon
    
    interface Props {
        inputUrl?: string;
        exampleUrl?: string;
        isLoading?: boolean;
        placeholder?: string;
        onload?: (data: { url: string }) => void;
    }
    
    let { 
        inputUrl = $bindable(''),
        exampleUrl = '',
        isLoading = false,
        placeholder = '',
        onload
    }: Props = $props();
    
    // Handle form submission
    function handleLoadData() {
        if (!inputUrl.trim()) {
            return;
        }
        onload?.({ url: inputUrl });
    }
    
    // Handle Enter key in input field
    function handleKeyPress(event: KeyboardEvent) {
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
                onclick={loadExample}
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
            onkeypress={handleKeyPress}
            disabled={isLoading}
        />
        <div class="flex justify-center">
            <button 
                class="btn-primary flex items-center gap-2"
                onclick={handleLoadData}
                disabled={isLoading || !inputUrl.trim()}
            >
                <div class="w-4 h-4">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
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