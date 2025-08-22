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

    // Local component state using runes
    let inputUrl = $state('');

    // Global store access using derived runes
    const loading = $derived($isLoading);
    const errorMessage = $derived($error);

    // Use example.zarr served from static/downloads directory - convert to full URL
    const exampleUrl = $derived(() => {
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
            
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            actions.setError(errorMsg);
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

<div class="min-h-[60vh] flex flex-col justify-center items-center">
    <DataInput 
        bind:inputUrl
        exampleUrl={exampleUrl()}
        isLoading={loading}
        onload={handleLoadData}
    />

    <LoadingState 
        isLoading={loading}
        error={errorMessage ?? ''}
        showRetryButton={false}
        onback={handleBack}
    />
</div>
