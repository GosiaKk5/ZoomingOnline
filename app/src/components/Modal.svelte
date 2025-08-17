<script>
    import { createEventDispatcher } from 'svelte';

    export let show = false;
    export let title = '';
    export let maxWidth = '600px';
    
    const dispatch = createEventDispatcher();
    
    function handleClose() {
        dispatch('close');
    }
    
    function handleKeydown(event) {
        if (event.key === 'Escape') {
            handleClose();
        }
    }
    
    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            handleClose();
        }
    }
</script>

{#if show}
    <div 
        class="modal-backdrop" 
        role="button"
        tabindex="0"
        on:click={handleBackdropClick}
        on:keydown={handleKeydown}
    >
        <div class="modal-content" style="max-width: {maxWidth}" role="dialog" aria-labelledby="modal-title">
            <div class="modal-header">
                <h2 id="modal-title" class="modal-title">{title}</h2>
                <button class="btn btn-close" on:click={handleClose} aria-label="Close modal">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <slot />
            </div>
        </div>
    </div>
{/if}