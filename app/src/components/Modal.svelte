<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    interface Props {
        show?: boolean;
        title?: string;
        onclose?: () => void;
        children?: import('svelte').Snippet;
    }

    let { show = $bindable(false), title = '', onclose, children }: Props = $props();
    
    function handleClose() {
        show = false;
        onclose?.();
    }
    
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            handleClose();
        }
    }
    
    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            handleClose();
        }
    }

    // Document-level escape key handler
    function handleDocumentKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && show) {
            event.preventDefault();
            event.stopPropagation();
            handleClose();
        }
    }

    onMount(() => {
        document.addEventListener('keydown', handleDocumentKeydown);
    });

    onDestroy(() => {
        document.removeEventListener('keydown', handleDocumentKeydown);
    });
</script>

{#if show}
    <div 
        class="modal-backdrop" 
        role="button"
        tabindex="0"
        onclick={handleBackdropClick}
        onkeydown={handleKeydown}
    >
        <div class="modal-content" role="dialog" aria-labelledby="modal-title">
            <div class="modal-header">
                <h2 id="modal-title" class="modal-title">{title}</h2>
                <button class="btn-close" onclick={handleClose} aria-label="Close modal">
                    <div class="w-5 h-5">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </div>
                </button>
            </div>
            <div class="modal-body">
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}