<script>
    import { onMount } from 'svelte';
    import Router from 'svelte-spa-router';
    import { location } from 'svelte-spa-router';
    import { push } from 'svelte-spa-router';
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

    // Define routes - only for our app routes, not static files
    const routes = {
        '/': Home,
        '/selection': Selection,
        '/visualization': Visualization
    };

    // Update URL with data parameter when route changes and data is loaded
    $: if ($location && $dataUrl) {
        const url = new URL(window.location);
        const currentDataParam = url.searchParams.get('data');
        if (currentDataParam !== $dataUrl) {
            url.searchParams.set('data', $dataUrl);
            window.history.replaceState(null, '', url.toString());
        }
    }

    // Update URL with selection parameters when they change (for visualization persistence)
    $: if ($location === '/visualization' && $selectedChannel && $selectedTrc && $selectedSegment) {
        const url = new URL(window.location);
        url.searchParams.set('channel', getIndexFromDisplayName($selectedChannel));
        url.searchParams.set('trc', getIndexFromDisplayName($selectedTrc));
        url.searchParams.set('segment', getIndexFromDisplayName($selectedSegment));
        // Note: zoom parameters are handled by the zoom state management in Charts.svelte
        window.history.replaceState(null, '', url.toString());
    }

    async function checkAndLoadDataFromUrl() {
        // Check if a data URL was provided in the query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlDataParam = urlParams.get('data');
        const urlChannelParam = urlParams.get('channel');
        const urlTrcParam = urlParams.get('trc');
        const urlSegmentParam = urlParams.get('segment');
        
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
        
        if (urlDataParam && !$isDataLoaded && !$isLoading) {
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
                
                // If we're not on a valid route for loaded data, navigate to selection
                if ($location === '/' || $location === '') {
                    console.log('🧭 Navigating to selection route from home...');
                    push('/selection');
                }
                
            } catch (err) {
                console.error('❌ Error during app-level data loading:', err);
                setError(err.message);
            } finally {
                setLoadingState(false);
            }
        } else if (!urlDataParam && ($location === '/selection' || $location === '/visualization')) {
            // If we're on selection/visualization route but no data param and no data loaded, go to home
            console.log('🚨 No data parameter found and on ' + $location + ' route, redirecting to home');
            push('/');
        }
    }

    onMount(() => {
        // Check for data URL parameter on mount
        checkAndLoadDataFromUrl();
    });

    // Also check when the location changes (for browser back/forward)
    $: if ($location !== undefined) {
        checkAndLoadDataFromUrl();
    }
</script>

<main class="container">
    <Header />
    
    <Router {routes} />
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
