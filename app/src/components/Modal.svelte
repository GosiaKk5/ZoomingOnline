<script>
    import { MdClose } from 'svelte-icons/md';
    import { createEventDispatcher } from 'svelte';

    export let show = false;
    export let title = '';
    
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
        <div class="modal-content" role="dialog" aria-labelledby="modal-title">
            <div class="modal-header">
                <h2 id="modal-title" class="modal-title">{title}</h2>
                <button class="btn-close" on:click={handleClose} aria-label="Close modal">
                    <div class="w-5 h-5">
                        <MdClose />
                    </div>
                </button>
            </div>
            <div class="modal-body">
                <slot />
            </div>
        </div>
    </div>
{/if}