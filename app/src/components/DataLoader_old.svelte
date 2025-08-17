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
    <div class="container-center">
        <h3 class="text-lg font-semibold mb-2">Load Zarr Data</h3>
        <p class="text-gray-600 mb-4">Please enter the full URL to your .zarr file.</p>
        <div class="example-hint">
            <p>For testing, try the example dataset: 
                <button 
                    class="btn-link" 
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
                class="form-control max-w-sm"
            />
            <button 
                on:click={handleLoadData}
                disabled={$isLoading || !inputUrl.trim()}
                class="btn-primary"
            >
                {$isLoading ? 'Loading...' : 'Load Data'}
            </button>
        </div>
    </div>
{/if}

{#if $currentView === 'selection'}
    <div class="container-center">
        {#if $isLoading}
            <div class="loading">
                <p>Loading data selectors...</p>
            </div>
        {:else if $error}
            <div class="text-red-600 p-4">
                <h3 class="font-semibold mb-2">Error</h3>
                <p class="mb-4">{$error}</p>
                <button on:click={() => currentView.set('input')} class="btn-secondary">
                    Try Again
                </button>
            </div>
        {:else if $isDataLoaded}
            <div class="space-y-4">
                <div class="flex flex-col items-center gap-2">
                    <label for="channel-select" class="font-medium text-gray-700">Channel:</label>
                    <select id="channel-select" bind:value={$selectedChannel} class="form-control max-w-xs">
                        <option value="">Select Channel</option>
                        {#each channels as channel}
                            <option value={channel}>{channel}</option>
                        {/each}
                    </select>
                </div>
                
                <div class="flex flex-col items-center gap-2">
                    <label for="trc-select" class="font-medium text-gray-700">TRC File:</label>
                    <select id="trc-select" bind:value={$selectedTrc} class="form-control max-w-xs">
                        <option value="">Select TRC File</option>
                        {#each trcFiles as trc}
                            <option value={trc}>{trc}</option>
                        {/each}
                    </select>
                </div>
                
                <div class="flex flex-col items-center gap-2">
                    <label for="segment-select" class="font-medium text-gray-700">Segment:</label>
                    <select id="segment-select" bind:value={$selectedSegment} class="form-control max-w-xs">
                        <option value="">Select Segment</option>
                        {#each segments as segment}
                            <option value={segment}>{segment}</option>
                        {/each}
                    </select>
                </div>
            </div>
            
            <button 
                class="btn-primary mt-6"
                on:click={handlePlotData}
                disabled={!$isDataReadyForPlot}
            >
                Plot Selected Data
            </button>
        {/if}
    </div>
{/if}

<!-- All styles moved to Tailwind CSS classes -->

    .input-group {
        display: flex;
        gap: var(--padding-sm);
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
    }

    input {
        font-size: 1rem;
        padding: var(--padding-sm);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-sm);
        width: 350px;
        max-width: 100%;
    }

    input:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }

    .example-hint {
        margin: var(--padding-sm) 0;
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
        background-color: var(--color-primary);
        border: none;
        border-radius: var(--border-radius-md);
        cursor: pointer;
        transition: background-color 0.2s;
    }

    button:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
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
        padding: var(--padding-sm);
        font-size: 1rem;
        border-radius: var(--border-radius-md);
        border: 1px solid var(--color-border);
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
