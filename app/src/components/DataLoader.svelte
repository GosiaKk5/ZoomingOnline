<script>
    import { MdCloudDownload } from 'svelte-icons/md';
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
        setError,
        appConfig
    } from '../stores/index.ts';
    import { loadZarrData } from '../utils/dataLoader.ts';
    import { populateSelectors } from '../utils/uiManager.ts';

    let inputUrl = '';
    let channels = [];
    let trcFiles = [];
    let segments = [];

    // Use the example URL from the centralized configuration
    $: exampleUrl = $appConfig.exampleDataUrl;

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
        <div class="mb-6 mt-6">
            <h3 class="text-lg font-semibold mb-4 px-4">Load Zarr Data - Enter full URL to your .zarr file</h3>
        </div>
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
        <div class="w-full max-w-2xl mx-auto">
            <input 
                type="text" 
                bind:value={inputUrl}
                placeholder={exampleUrl}
                on:keypress={handleKeyPress}
                disabled={$isLoading}
                class="form-control font-mono text-sm text-gray-900 bg-gray-50 border-2 border-gray-300 focus:border-blue-500 focus:bg-white w-full mb-4"
            />
            <div class="flex justify-center">
                <button 
                    on:click={handleLoadData}
                    disabled={$isLoading || !inputUrl.trim()}
                    class="btn-primary flex items-center gap-2"
                >
                    <div class="w-4 h-4">
                        <MdCloudDownload />
                    </div>
                    {$isLoading ? 'Loading...' : 'Load Data'}
                </button>
            </div>
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