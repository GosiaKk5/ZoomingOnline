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
        selectedSegment 
    } from './stores/appStore.js';
    import { generateTimeSteps } from './utils/timeUtils.js';
    import { loadZarrData } from './utils/dataLoader.js';
    
    // Import components
    import Header from './components/Header.svelte';
    import CopyLink from './components/CopyLink.svelte';
    
    // Import route components
    import Home from './routes/Home.svelte';
    import Selection from './routes/Selection.svelte';
    import Visualization from './routes/Visualization.svelte';

    // Define routes - only for our app routes, not static files
    const routes = {
        '/': Home,
        '/selection': Selection,
        '/visualization': Visualization
    };

    // Update URL with data parameter when route changes and data is loaded
    $: if ($location && $dataUrl) {
        const url = new URL(window.location);
        if (!url.searchParams.has('data')) {
            url.searchParams.set('data', $dataUrl);
            window.history.replaceState(null, '', url.toString());
        }
    }

    // Update URL with selection parameters when they change (for visualization persistence)
    $: if ($location === '/visualization' && $selectedChannel && $selectedTrc && $selectedSegment) {
        const url = new URL(window.location);
        url.searchParams.set('channel', $selectedChannel);
        url.searchParams.set('trc', $selectedTrc);
        url.searchParams.set('segment', $selectedSegment);
        window.history.replaceState(null, '', url.toString());
    }

    async function checkAndLoadDataFromUrl() {
        // Check if a data URL was provided in the query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlDataParam = urlParams.get('data');
        const urlChannelParam = urlParams.get('channel');
        const urlTrcParam = urlParams.get('trc');
        const urlSegmentParam = urlParams.get('segment');
        
        console.log('🔍 App-level checking URL parameters:');
        console.log('  - Full URL:', window.location.href);
        console.log('  - Search params:', window.location.search);
        console.log('  - Data param:', urlDataParam);
        console.log('  - Channel param:', urlChannelParam);
        console.log('  - TRC param:', urlTrcParam);
        console.log('  - Segment param:', urlSegmentParam);
        console.log('  - Is data loaded:', $isDataLoaded);
        console.log('  - Current route:', $location);
        
        // Restore selection parameters if they exist and current values are empty
        if (urlChannelParam && (!$selectedChannel || $selectedChannel === '')) {
            console.log('🔄 Restoring channel from URL:', urlChannelParam);
            selectedChannel.set(urlChannelParam);
        }
        if (urlTrcParam && (!$selectedTrc || $selectedTrc === '')) {
            console.log('🔄 Restoring TRC from URL:', urlTrcParam);
            selectedTrc.set(urlTrcParam);
        }
        if (urlSegmentParam && (!$selectedSegment || $selectedSegment === '')) {
            console.log('🔄 Restoring segment from URL:', urlSegmentParam);
            selectedSegment.set(urlSegmentParam);
        }
        
        if (urlDataParam && !$isDataLoaded && !$isLoading) {
            console.log('🚀 App-level auto-loading data from URL parameter:', urlDataParam);
            
            setLoadingState(true);
            
            try {
                console.log('🔄 Calling loadZarrData from App...');
                await loadZarrData(urlDataParam);
                console.log('✅ loadZarrData completed successfully');
                
                console.log('💾 Updating stores...');
                dataUrl.set(urlDataParam);
                isDataLoaded.set(true);
                setError(null);
                console.log('  - dataUrl store updated to:', urlDataParam);
                console.log('  - isDataLoaded set to true');
                
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
        // Generate time steps early
        generateTimeSteps();
        
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
    
    <CopyLink />
    
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
