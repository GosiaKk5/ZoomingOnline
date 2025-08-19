<script>
    import { onMount, onDestroy } from 'svelte';
    import { path, push, initRouter, updateQuery } from './router.ts';
    import { 
        dataUrl, 
        isDataLoaded, 
        isLoading, 
        setLoadingState, 
        setError,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        showCopyLink,
        plotActions
    } from './stores/index.ts';
    import { loadZarrData } from './services/dataService.ts';
    
    // Import components
    import Header from './components/Header.svelte';
    
    // Import route components
    import Home from './routes/Home.svelte';
    import Selection from './routes/Selection.svelte';
    import Visualization from './routes/Visualization.svelte';

    // Helper functions to convert between display names and numeric indices
    function getIndexFromDisplayName(displayName) {
        // Extract number from "Channel 1", "TRC 2", "Segment 3", etc.
        const match = displayName.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 1;
    }

    function getDisplayNameFromIndex(type, index) {
        // Convert number back to display name
        const typeNames = {
            channel: 'Channel',
            trc: 'TRC', 
            segment: 'Segment'
        };
        return `${typeNames[type]} ${index}`;
    }

    // Initialize minimal router
    initRouter();

    // URL updates are handled explicitly at navigation points to avoid reactive loops under Svelte 5
    let navigatedOnParam = false;

    async function checkAndLoadDataFromUrl() {
        // Check if a data URL was provided in the query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlDataParam = urlParams.get('data');
        const urlChannelParam = urlParams.get('channel');
        const urlTrcParam = urlParams.get('trc');
        const urlSegmentParam = urlParams.get('segment');
    console.log('[router] checkAndLoadDataFromUrl path=', $path, 'data=', urlDataParam, 'loaded=', $isDataLoaded, 'loading=', $isLoading);
        
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
            // Navigate to selection once so the user sees loading state (but don't bounce from data views)
            if (!navigatedOnParam && $path !== '/selection' && $path !== '/visualization') {
                console.log('🧭 Navigating to selection before loading (once)');
                push('/selection');
                navigatedOnParam = true;
            }

            if (!$isDataLoaded && !$isLoading) {
            console.log('🚀 App-level auto-loading data from URL parameter:', urlDataParam);
            
            setLoadingState(true);
            
            try {
                console.log('🔄 Calling loadZarrData from App...');
                await loadZarrData(urlDataParam);
                console.log('✅ loadZarrData completed successfully');
                dataUrl.set(urlDataParam);
                isDataLoaded.set(true);
                showCopyLink.set(true);
                setError(null);

                // Explicitly sync data URL param for shareable links
                updateQuery((u) => {
                    u.searchParams.set('data', urlDataParam);
                });
                
                // Ensure we're on a data view route after loading (one-time)
                if (!navigatedOnParam && $path !== '/selection' && $path !== '/visualization') {
                    console.log('🧭 Navigating to selection route... current path:', $path);
                    push('/selection');
                    navigatedOnParam = true;
                }
                
            } catch (err) {
                console.error('❌ Error during app-level data loading:', err);
                setError(err.message);
            } finally {
                setLoadingState(false);
            }
        }
    } else if (!urlDataParam && !$isDataLoaded && ($path === '/selection' || $path === '/visualization')) {
            // If we're on selection/visualization route but no data param and no data loaded, go to home
            console.log('🚨 No data parameter found and on ' + $path + ' route, redirecting to home');
            push('/');
        }
    }

    onMount(() => {
        console.log('[router] onMount current path=', $path);
        // Check for data URL parameter on mount
        checkAndLoadDataFromUrl();
    });

    // Also check when the location changes (for browser back/forward)
    let unsubscribePath;
    onMount(() => {
        unsubscribePath = path.subscribe(() => {
            checkAndLoadDataFromUrl();
        });
    });
    // Cleanup
    onDestroy(() => {
        unsubscribePath && unsubscribePath();
    });
</script>

<main class="container">
    <Header />
    {#if $path === '/'}
        <Home />
    {:else if $path === '/selection'}
        <Selection />
    {:else if $path === '/visualization'}
        <Visualization />
    {:else}
        <Home />
    {/if}
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
