<script>
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { 
        dataUrl, 
        isDataLoaded, 
        isLoading, 
        setLoadingState, 
        setError,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        showCopyLink
    } from '../stores/index';
    import { loadZarrData } from '../services/dataService';
    import { UrlService } from '../services/urlService';
    
    // Import components
    import Header from '../components/Header.svelte';
    import '../app.css';

    // Helper functions to convert between display names and numeric indices
    function getIndexFromDisplayName(displayName) {
        const match = displayName.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 1;
    }

    function getDisplayNameFromIndex(type, index) {
        const typeNames = {
            channel: 'Channel',
            trc: 'TRC', 
            segment: 'Segment'
        };
        return `${typeNames[type]} ${index}`;
    }

    let navigatedOnParam = false;

    async function checkAndLoadDataFromUrl() {
        const urlParams = UrlService.getUrlParams();
        const urlDataParam = urlParams.get('data');
        const urlChannelParam = urlParams.get('channel');
        const urlTrcParam = urlParams.get('trc');
        const urlSegmentParam = urlParams.get('segment');
        
        console.log('[layout] checkAndLoadDataFromUrl path=', $page.route.id, 'data=', urlDataParam, 'loaded=', $isDataLoaded, 'loading=', $isLoading);
        
        // Restore selection parameters if they exist and current values are empty
        if (urlChannelParam && (!$selectedChannel || $selectedChannel === '')) {
            const channelDisplayName = getDisplayNameFromIndex('channel', parseInt(urlChannelParam));
            selectedChannel.set(channelDisplayName);
        }
        if (urlTrcParam && (!$selectedTrc || $selectedTrc === '')) {
            const trcDisplayName = getDisplayNameFromIndex('trc', parseInt(urlTrcParam));
            selectedTrc.set(trcDisplayName);
        }
        if (urlSegmentParam && (!$selectedSegment || $selectedSegment === '')) {
            const segmentDisplayName = getDisplayNameFromIndex('segment', parseInt(urlSegmentParam));
            selectedSegment.set(segmentDisplayName);
        }
        
        if (urlDataParam) {
            // Navigate to selection once so the user sees loading state
            if (!navigatedOnParam && $page.route.id !== '/selection' && $page.route.id !== '/visualization') {
                console.log('🧭 Navigating to selection before loading (once)');
                goto(`${base}/selection`);
                navigatedOnParam = true;
            }

            if (!$isDataLoaded && !$isLoading) {
                console.log('🚀 Layout-level auto-loading data from URL parameter:', urlDataParam);
                
                setLoadingState(true);
                
                try {
                    console.log('🔄 Calling loadZarrData from Layout...');
                    await loadZarrData(urlDataParam);
                    console.log('✅ loadZarrData completed successfully');
                    dataUrl.set(urlDataParam);
                    isDataLoaded.set(true);
                    showCopyLink.set(true);
                    setError(null);
                    
                    // Ensure we're on a data view route after loading (one-time)
                    if (!navigatedOnParam && $page.route.id !== '/selection' && $page.route.id !== '/visualization') {
                        console.log('🧭 Navigating to selection route... current route:', $page.route.id);
                        goto(`${base}/selection`);
                        navigatedOnParam = true;
                    }
                    
                } catch (err) {
                    console.error('❌ Error during layout-level data loading:', err);
                    setError(err.message);
                } finally {
                    setLoadingState(false);
                }
            }
        } else if (!urlDataParam && !$isDataLoaded && ($page.route.id === '/selection' || $page.route.id === '/visualization')) {
            // If we're on selection/visualization route but no data param and no data loaded, go to home
            console.log('🚨 No data parameter found and on ' + $page.route.id + ' route, redirecting to home');
            goto('/');
        }
    }

    onMount(() => {
        console.log('[layout] onMount current route=', $page.route.id);
        checkAndLoadDataFromUrl();
    });

    // Watch for page changes
    $: if ($page.url) {
        checkAndLoadDataFromUrl();
    }
</script>

<main class="container">
    <Header />
    <slot />
</main>

<style>
    :global(body) {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8f9fa;
        color: #333;
        margin: 0;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .container {
        width: 100%;
        max-width: 900px;
    }

    /* Global responsive styles */
    @media (max-width: 768px) {
        :global(body) {
            padding: 1rem;
        }
        
        .container {
            max-width: 100%;
        }
    }
</style>