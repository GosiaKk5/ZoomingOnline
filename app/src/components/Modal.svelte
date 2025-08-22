<script lang="ts">
    import { X } from '@lucide/svelte';
    import type { Snippet } from 'svelte';

    // Props using Svelte 5 $props() with proper TypeScript typing
    const { 
        show = false,
        title = '',
        onclose = () => {},
        children
    }: {
        show?: boolean;
        title?: string;
        onclose?: () => void;
        children: Snippet;
    } = $props();
    
    function handleClose(): void {
        onclose?.();
    }
    
    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            handleClose();
        }
    }
    
    function handleBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            handleClose();
        }
    }

    // Document-level escape key handler using runes effect
    $effect(() => {
        function handleDocumentKeydown(event: KeyboardEvent): void {
            if (event.key === 'Escape' && show) {
                event.preventDefault();
                event.stopPropagation();
                handleClose();
            }
        }

        if (show) {
            document.addEventListener('keydown', handleDocumentKeydown);
            
            // Cleanup function
            return () => {
                document.removeEventListener('keydown', handleDocumentKeydown);
            };
        }
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
                    <X class="w-5 h-5" />
                </button>
            </div>
            <div class="modal-body">
                {@render children()}
            </div>
        </div>
    </div>
{/if}