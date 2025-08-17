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
    <h3>Load Zarr Data</h3>
    <p>Please enter the full URL to your .zarr file.</p>
    <div class="example-hint">
        <p>For testing, try the example dataset: 
            <button 
                class="btn btn-link" 
                on:click={loadExample}
                disabled={$isLoading}
            >
                {exampleUrl}
            </button>
        </p>
    </div>
    <div class="input-group">
        <input 
            type="text" 
            bind:value={inputUrl}
            placeholder={exampleUrl}
            on:keypress={handleKeyPress}
            disabled={$isLoading}
        />
        <button 
            class="btn btn-primary"
            on:click={handleLoadData}
            disabled={$isLoading || !inputUrl.trim()}
        >
            {$isLoading ? 'Loading...' : 'Load Data'}
        </button>
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
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        text-align: center;
        margin-bottom: 1rem;
    }

    .input-group {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
    }

    input {
        font-size: 1rem;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 350px;
        max-width: 100%;
    }

    input:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }

    .example-hint {
        margin: 0.5rem 0;
        padding: 0.75rem;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        font-size: 0.875rem;
        color: #495057;
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

    @media (max-width: 768px) {
        .input-group {
            flex-direction: column;
        }
        
        input {
            width: 100%;
        }
    }
</style>
