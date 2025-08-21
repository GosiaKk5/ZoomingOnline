<script lang="ts">
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { browser } from '$app/environment';
    import { 
        isLoading, 
        error, 
        actions
    } from '../stores/index';
    import { loadZarrData } from '../services/dataService';
    import DataInput from '../components/DataInput.svelte';
    import LoadingState from '../components/LoadingState.svelte';

    let inputUrl = $state('');

    // Use example.zarr served from static/downloads directory - convert to full URL
    let exampleUrl = $derived(() => {
        if (browser) {
            return new URL('/downloads/example.zarr', window.location.origin).toString();
        }
        return '/downloads/example.zarr'; // Fallback for SSR
    });

    async function handleLoadData(event: { url: string }) {
        const url = event.url;
        
        actions.setLoading(true);
        
        try {
            await loadZarrData(url);
            actions.setData({ url, isLoaded: true });
            actions.setUI({ showCopyLink: true });
            actions.setError('');
            
            // Navigate to selection
            goto(`${base}/selection`);
            
        } catch (err: any) {
            actions.setError(err.message);
        } finally {
            actions.setLoading(false);
        }
    }

    function handleBack() {
        // Reset error state when going back
        actions.setError('');
    }
</script>

<svelte:head>
    <title>ZoomingOnline - Interactive Raw Data Analysis</title>
</svelte:head>

<DataInput 
    bind:inputUrl={inputUrl}
    exampleUrl={exampleUrl()}
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
