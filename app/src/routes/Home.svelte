<script>
    import { onMount } from 'svelte';
    import { 
        dataUrl, 
        isLoading, 
        error, 
        isDataLoaded,
        setLoadingState,
        setError
    } from '../stores/appStore.js';
    import { loadZarrData } from '../utils/dataLoader.js';
    import { push } from 'svelte-spa-router';

    let inputUrl = '';

    // Construct the full example URL that works both locally and on GitHub Pages
    $: exampleUrl = `${window.location.origin}${import.meta.env.BASE_URL}example.zarr`;

    onMount(() => {
        // Check if a data URL was provided in the query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlDataParam = urlParams.get('data');
        
        if (urlDataParam && !$isDataLoaded) {
            inputUrl = urlDataParam;
            handleLoadData();
        }
    });

    async function handleLoadData() {
        if (!inputUrl.trim()) return;
        
        setLoadingState(true);
        
        try {
            await loadZarrData(inputUrl);
            dataUrl.set(inputUrl);
            isDataLoaded.set(true);
            setError(null);
            
            // Update URL with data parameter for shareable links
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('data', inputUrl);
            window.history.replaceState({ path: newUrl.href }, '', newUrl.href);
            
            // Navigate to selection route
            push('/selection');
            
        } catch (err) {
            setError(err.message);
        } finally {
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
        inputUrl = exampleUrl;
        handleLoadData();
    }
</script>

<div class="input-container">
    <h3>Load Zarr Data</h3>
    <p>Please enter the full URL to your .zarr file.</p>
    <div class="example-hint">
        <p>For testing, try the example dataset: 
            <button 
                class="link-button" 
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

    .link-button {
        background: none;
        border: none;
        color: #007bff;
        text-decoration: underline;
        cursor: pointer;
        font-size: inherit;
        padding: 0;
        margin: 0;
    }

    .link-button:hover:not(:disabled) {
        color: #0056b3;
        background: none;
    }

    .link-button:disabled {
        color: #6c757d;
        cursor: not-allowed;
        text-decoration: none;
    }

    button {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        color: #fff;
        background-color: #007bff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    button:hover:not(:disabled) {
        background-color: #0056b3;
    }

    button:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
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
