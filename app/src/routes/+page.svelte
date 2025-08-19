<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { base } from '$app/paths';
    import { 
        dataUrl, 
        isLoading, 
        error, 
        isDataLoaded,
        setLoadingState,
        setError,
        appConfig
    } from '../stores/index.ts';
    import { loadZarrData } from '../services/dataService.ts';
    import DataInput from '../components/DataInput.svelte';
    import LoadingState from '../components/LoadingState.svelte';

    let inputUrl = '';

    // Use the example URL from the centralized configuration
    $: exampleUrl = $appConfig.exampleDataUrl;

    async function handleLoadData(event) {
        const url = event.detail.url;
        
        setLoadingState(true);
        
        try {
            await loadZarrData(url);
            dataUrl.set(url);
            isDataLoaded.set(true);
            setError(null);
            
            // Navigate to selection with data parameter
            goto(`${base}/selection?data=${encodeURIComponent(url)}`);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingState(false);
        }
    }

    function handleBack() {
        // Reset error state when going back
        setError(null);
    }
</script>

<svelte:head>
    <title>ZoomingOnline - Interactive Raw Data Analysis</title>
</svelte:head>

<DataInput 
    bind:inputUrl={inputUrl}
    exampleUrl={exampleUrl}
    isLoading={$isLoading}
    on:load={handleLoadData}
/>

<LoadingState 
    isLoading={$isLoading}
    error={$error}
    showRetryButton={false}
    on:back={handleBack}
/>

<!-- No styles needed - using component styles -->
