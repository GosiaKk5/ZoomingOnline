<script>
    import { onMount } from 'svelte';
    import { 
        showPlotAnotherButton,
        isDataReadyForPlot,
        selectedChannel,
        selectedTrc,
        selectedSegment,
        rawStore,
        overviewStore,
        plotConfig,
        timeSteps,
        isLoading,
        isDataLoaded
    } from '../stores/appStore.ts';
    import { push } from 'svelte-spa-router';
    
    import Charts from '../components/Charts.svelte';
    import ShareButton from '../components/ShareButton.svelte';

    onMount(() => {
        // Show plot another button when entering visualization mode
        showPlotAnotherButton.set(true);

        return () => {
            showPlotAnotherButton.set(false);
        };
    });

    function handleGoBack() {
        push('/selection');
    }

    // Redirect to selection if data is not ready (but allow time for loading on refresh)
    let hasAttemptedLoad = false;
    
    $: if (!$isDataReadyForPlot && !$isLoading && hasAttemptedLoad && $isDataLoaded) {
        // Only redirect if we've attempted to load, we're not currently loading,
        // and we have loaded data but selections aren't ready
        push('/selection');
        push('/selection');
    }
    
    // Track when we've attempted to load data to prevent premature redirects
    $: if ($isDataLoaded || $isLoading) {
        hasAttemptedLoad = true;
    }
</script>

{#if $isDataReadyForPlot}
    <div class="visualization-container">
        <div class="navigation">
            <div class="left-section">
                <button class="btn btn-primary btn-sm" on:click={handleGoBack}>
                    ← Back to Selection
                </button>
                <div class="selection-info">
                    <span class="info-label">Channel:</span>
                    <span class="info-value">{$selectedChannel}</span>
                    <span class="info-separator">|</span>
                    <span class="info-label">TRC:</span>
                    <span class="info-value">{$selectedTrc}</span>
                    <span class="info-separator">|</span>
                    <span class="info-label">Segment:</span>
                    <span class="info-value">{$selectedSegment}</span>
                </div>
            </div>
            <ShareButton />
        </div>
        
        <Charts />
    </div>
{/if}

<style>
    .visualization-container {
        width: 100%;
    }

    .navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: var(--padding-md);
        background: white;
        border-radius: var(--border-radius-lg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .selection-info {
        display: flex;
        align-items: center;
        gap: var(--padding-sm);
        font-size: 0.875rem;
        color: #495057;
    }

    .info-label {
        font-weight: 600;
        color: #343a40;
    }

    .info-value {
        color: #007bff;
        font-weight: 500;
    }

    .info-separator {
        color: #6c757d;
        margin: 0 0.25rem;
    }

    .left-section {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
</style>
