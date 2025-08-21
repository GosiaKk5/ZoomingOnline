<script lang="ts">
    import { MdClose } from 'svelte-icons/md';

    interface Props {
        show?: boolean;
        title?: string;
        onclose?: () => void;
        children?: import('svelte').Snippet;
    }

    let { show = $bindable(false), title = '', onclose, children }: Props = $props();
    
    function handleClose() {
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
                        <MdClose />
                    </div>
                </button>
            </div>
            <div class="modal-body">
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}