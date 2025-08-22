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
    <main class="w-full max-w-6xl mx-auto px-4">
        <Header />
        {@render children()}
    </main>
</ErrorBoundary>

<style>
    /* Full width for visualization route */
    :global(.visualization-page) main {
        max-width: 95%;
        width: 95%;
    }
</style>