<script lang="ts">
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { 
        dataUrl, 
        isLoading, 
        error, 
        isDataLoaded,
        setLoadingState,
        setError,
        showCopyLink,
        appConfig
    } from '../stores/index';
    import { loadZarrData } from '../services/dataService';
    import { UrlService } from '../services/urlService';
    import DataInput from '../components/DataInput.svelte';
    import LoadingState from '../components/LoadingState.svelte';

    let inputUrl = $state('');

    // Use the example URL from the centralized configuration
    let exampleUrl = $derived($appConfig.exampleDataUrl);

    async function handleLoadData(event: { url: string }) {
        const url = event.url;
        
        setLoadingState(true);
        
        try {
            await loadZarrData(url);
            dataUrl.set(url);
            isDataLoaded.set(true);
            showCopyLink.set(true);
            setError('');
            
            // Use new URL service to set only data parameter and clear all others
            UrlService.loadDataUrl(url);
            
            // Navigate to selection
            goto(`${base}/selection`);
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingState(false);
        }
    }

    function handleBack() {
        // Reset error state when going back
        setError('');
    }
</script>

<svelte:head>
    <title>ZoomingOnline - Interactive Raw Data Analysis</title>
</svelte:head>

<DataInput 
    bind:inputUrl={inputUrl}
    exampleUrl={exampleUrl}
    isLoading={$isLoading}
    onload={handleLoadData}
/>

<LoadingState 
    isLoading={$isLoading}
    error={$error ?? ''}
    showRetryButton={false}
    onback={handleBack}
/>

<!-- No styles needed - using component styles -->
