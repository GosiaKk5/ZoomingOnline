<script>
    import { 
        dataUrl, 
        isLoading, 
        error, 
        currentView, 
        isDataLoaded,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        rawStore,
        isDataReadyForPlot,
        showCopyLink,
        setLoadingState,
        setError
    } from '../stores/appStore.ts';
    import { loadZarrData } from '../utils/dataLoader.ts';
    import { populateSelectors } from '../utils/uiManager.ts';

    let inputUrl = '';
    let channels = [];
    let trcFiles = [];
    let segments = [];

    // Construct the full example URL that works both locally and on GitHub Pages
    $: exampleUrl = `${window.location.origin}${import.meta.env.BASE_URL}example.zarr`;

    // Reactive statements
    $: if ($rawStore) {
        populateSelectors($rawStore).then(data => {
            channels = data.channels;
            trcFiles = data.trcFiles;
            segments = data.segments;
        });
    }

    async function handleLoadData() {
        if (!inputUrl.trim()) return;
        
        setLoadingState(true);
        currentView.set('selection');
        
        try {
            await loadZarrData(inputUrl);
            dataUrl.set(inputUrl);
            isDataLoaded.set(true);
            showCopyLink.set(true);
            setError(null);
            
            // Update URL with data parameter for shareable links
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('data', inputUrl);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            
        } catch (err) {
            setError(err.message);
            currentView.set('input');
        } finally {
            setLoadingState(false);
        }
    }

    function handlePlotData() {
        if ($isDataReadyForPlot) {
            currentView.set('visualization');
        }
    }

    // Handle Enter key in input field
    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            handleLoadData();
        }
    }
</script>

{#if $currentView === 'input'}
    <div class="input-container">
        <h3>Load Zarr Data</h3>
        <p>Please enter the full URL to your .zarr file.</p>
        <div class="example-hint">
            <p>For testing, try the example dataset: 
                <button 
                    class="link-button" 
                    on:click={() => { inputUrl = exampleUrl; handleLoadData(); }}
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
    </div>
{/if}

{#if $currentView === 'selection'}
    <div class="selection-container">
        {#if $isLoading}
            <div class="loading">
                <p>Loading data selectors...</p>
            </div>
        {:else if $error}
            <div class="error">
                <h3>Error</h3>
                <p>{$error}</p>
                <button on:click={() => currentView.set('input')}>
                    Try Again
                </button>
            </div>
        {:else if $isDataLoaded}
            <div class="selection-controls">
                <div class="control">
                    <label for="channel-select">Channel:</label>
                    <select id="channel-select" bind:value={$selectedChannel}>
                        <option value="">Select Channel</option>
                        {#each channels as channel}
                            <option value={channel}>{channel}</option>
                        {/each}
                    </select>
                </div>
                
                <div class="control">
                    <label for="trc-select">TRC File:</label>
                    <select id="trc-select" bind:value={$selectedTrc}>
                        <option value="">Select TRC File</option>
                        {#each trcFiles as trc}
                            <option value={trc}>{trc}</option>
                        {/each}
                    </select>
                </div>
                
                <div class="control">
                    <label for="segment-select">Segment:</label>
                    <select id="segment-select" bind:value={$selectedSegment}>
                        <option value="">Select Segment</option>
                        {#each segments as segment}
                            <option value={segment}>{segment}</option>
                        {/each}
                    </select>
                </div>
            </div>
            
            <button 
                class="plot-button"
                on:click={handlePlotData}
                disabled={!$isDataReadyForPlot}
            >
                Plot Selected Data
            </button>
        {/if}
    </div>
{/if}

<style>
    .input-container, .selection-container {
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

    .plot-button {
        margin-top: 1rem;
    }

    .selection-controls {
        display: flex;
        gap: 1rem;
        align-items: end;
        justify-content: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .control {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }

    label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #333;
    }

    select {
        padding: 0.5rem;
        font-size: 1rem;
        border-radius: 5px;
        border: 1px solid #ccc;
        min-width: 150px;
    }

    .loading {
        padding: 2rem;
        color: #666;
        font-style: italic;
    }

    .error {
        padding: 2rem;
        color: #dc3545;
    }

    .error h3 {
        margin-top: 0;
        color: #dc3545;
    }

    .error button {
        background-color: #dc3545;
        margin-top: 1rem;
    }

    .error button:hover {
        background-color: #c82333;
    }

    @media (max-width: 768px) {
        .input-group {
            flex-direction: column;
        }
        
        input {
            width: 100%;
        }
        
        .selection-controls {
            flex-direction: column;
            align-items: center;
        }
    }
</style>
