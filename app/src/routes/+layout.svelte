<script lang="ts">
    import { 
        setError
    } from '../stores/index';
    
    // Import components
    import Header from '../components/Header.svelte';
    import ErrorBoundary from '../components/ErrorBoundary.svelte';
    import '../app.css';
    import type { Snippet } from 'svelte';

    // Children snippet for layout using Svelte 5 pattern
    const { 
        children 
    }: {
        children: Snippet;
    } = $props();
    
    function handleLayoutError(error: Error): void {
        console.error('Layout error:', error);
        setError(error.message);
    }

    function handleRetryLayout(): void {
        setError(null);
    }
</script>

<ErrorBoundary 
    context="Application Layout"
    onError={handleLayoutError}
    onRetry={handleRetryLayout}
>
    <main class="container">
        <Header />
        {@render children()}
    </main>
</ErrorBoundary>

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
        max-width: 1400px; /* Increased from 900px for wider visualization */
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

    /* Full width for visualization route */
    :global(.visualization-page) .container {
        max-width: 95%;
        width: 95%;
    }
</style>