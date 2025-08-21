<script>
    import { MdShare, MdContentCopy, MdCheck } from 'svelte-icons/md';
    import { showCopyLink, currentDataUrl } from '../stores/index';
    import { UrlService } from '../services/urlService';
    import Modal from './Modal.svelte';
    
    // Local component state using runes
    let showModal = $state(false);
    let isCopied = $state(false);
    let shareableUrl = $state('');
    
    // Update shareable URL when modal opens to ensure it includes all necessary parameters
    function openModal() {
        shareableUrl = UrlService.generateShareUrl();
        showModal = true;
    }
    
    function closeModal() {
        showModal = false;
        isCopied = false;
    }
    
    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(shareableUrl);
            isCopied = true;
            setTimeout(() => {
                isCopied = false;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareableUrl;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                isCopied = true;
                setTimeout(() => {
                    isCopied = false;
                }, 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
            }
            document.body.removeChild(textArea);
        }
    }
</script>

{#if $showCopyLink}
    <button class="btn-primary btn-sm" onclick={openModal}>
        <div class="w-4 h-4">
            <MdShare />
        </div>
        Share
    </button>
{/if}

<Modal bind:show={showModal} title="Share Dataset" on:close={closeModal}>
    <p class="text-gray-500 mb-6 text-sm leading-relaxed">
        Copy this URL to share the current dataset, visualization settings, and zoom state with others:
    </p>
    
    <div class="mb-6">
        <input 
            type="text" 
            class="form-control w-full font-mono text-sm text-gray-900 bg-gray-50 border-2 border-gray-300" 
            value={shareableUrl} 
            readonly
            onfocus={(e) => e.target.select()}
        />
    </div>
    
    <button 
        class="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 mx-auto"
        class:btn-success={isCopied}
        class:btn-primary={!isCopied}
        onclick={copyToClipboard}
    >
        <div class="w-4 h-4">
            {#if isCopied}
                <MdCheck />
            {:else}
                <MdContentCopy />
            {/if}
        </div>
        <span class="copy-text">{isCopied ? 'Copied!' : 'Copy URL'}</span>
    </button>
</Modal>