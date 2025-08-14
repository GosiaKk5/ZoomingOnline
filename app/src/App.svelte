<script>
    import { onMount } from 'svelte';
    import Router from 'svelte-spa-router';
    import { generateTimeSteps } from './utils/timeUtils.js';
    
    // Import components
    import Header from './components/Header.svelte';
    import CopyLink from './components/CopyLink.svelte';
    
    // Import route components
    import Home from './routes/Home.svelte';
    import Selection from './routes/Selection.svelte';
    import Visualization from './routes/Visualization.svelte';

    // Define routes
    const routes = {
        '/': Home,
        '/selection': Selection,
        '/visualization': Visualization
    };

    onMount(() => {
        // Generate time steps early
        generateTimeSteps();
    });
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
