<script>
    import { onMount } from 'svelte';
    import { 
        dataUrl, 
        isLoading, 
        error, 
        isDataLoaded,
        setLoadingState,
        setError
    } from '../stores/appStore.ts';
    import { loadZarrData } from '../utils/dataLoader.ts';
    import { push } from 'svelte-spa-router';

    let inputUrl = '';

    // Construct the full example URL using the dedicated static route
    $: exampleUrl = `${window.location.origin}${import.meta.env.BASE_URL}static/example.zarr`;

    onMount(() => {
        console.log('🏠 Home component mounted');
        console.log('  - Current data loaded state:', $isDataLoaded);
        console.log('  - Current dataUrl:', $dataUrl);
        
        // Note: Data loading from URL parameters is now handled at the App level
        // This component only handles manual data input
    });

    async function handleLoadData() {
        if (!inputUrl.trim()) {
            console.log('❌ No input URL provided');
            return;
        }
        
        console.log('📊 Starting data load process...');
        console.log('  - Input URL:', inputUrl);
        console.log('  - Current loading state:', $isLoading);
        console.log('  - Current data loaded state:', $isDataLoaded);
        
        setLoadingState(true);
        console.log('  - Loading state set to true');
        
        try {
            console.log('🔄 Calling loadZarrData...');
            await loadZarrData(inputUrl);
            console.log('✅ loadZarrData completed successfully');
            
            console.log('💾 Updating stores...');
            dataUrl.set(inputUrl);
            isDataLoaded.set(true);
            setError(null);
            console.log('  - dataUrl store updated to:', inputUrl);
            console.log('  - isDataLoaded set to true');
            console.log('  - error cleared');
            
            console.log('🧭 Navigating to selection route...');
            push('/selection');
            console.log('  - Navigation push() called');
            
        } catch (err) {
            console.error('❌ Error during data loading:', err);
            console.error('  - Error message:', err.message);
            console.error('  - Error stack:', err.stack);
            setError(err.message);
        } finally {
            console.log('🏁 Setting loading state to false');
            setLoadingState(false);
        }
    }

    // Handle Enter key in input field
    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            handleLoadData();
        }
    }

    function loadExample() {
        console.log('🎯 Example button clicked');
        console.log('  - Example URL:', exampleUrl);
        inputUrl = exampleUrl;
        console.log('  - Input URL set to example URL');
        handleLoadData();
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
                disabled={$isLoading}
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
            placeholder={exampleUrl}
            on:keypress={handleKeyPress}
            disabled={$isLoading}
        />
        <div class="flex justify-center">
            <button 
                class="btn-primary flex items-center gap-2"
                on:click={handleLoadData}
                disabled={$isLoading || !inputUrl.trim()}
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                </svg>
                {$isLoading ? 'Loading...' : 'Load Data'}
            </button>
        </div>
    </div>

    {#if $error}
        <div class="error">
            <h3>Error</h3>
            <p>{$error}</p>
        </div>
    {/if}
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

    .error {
        padding: 2rem;
        color: #dc3545;
        margin-top: 1rem;
    }

    .error h3 {
        margin-top: 0;
        color: #dc3545;
    }
</style>
