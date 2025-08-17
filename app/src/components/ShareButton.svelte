<script>
    import { showCopyLink, currentDataUrl } from '../stores/appStore.ts';
    import Modal from './Modal.svelte';
    
    let showModal = false;
    let isCopied = false;
    
    $: shareableUrl = $currentDataUrl ? 
        `${window.location.href}` : '';
    
    function openModal() {
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
    <button class="btn-primary btn-sm" on:click={openModal}>
        <svg class="share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        Share
    </button>
{/if}

<Modal bind:show={showModal} title="Share Dataset" on:close={closeModal}>
    <p class="text-gray-500 mb-6 text-sm leading-relaxed">Copy this URL to share the current dataset and visualization settings with others:</p>
    
    <div class="mb-6">
        <input 
            type="text" 
            class="form-control w-full font-mono text-sm text-gray-900 bg-gray-50 border-2 border-gray-300" 
            value={shareableUrl} 
            readonly
            on:focus={(e) => e.target.select()}
        />
    </div>
    
    <button 
        class="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 mx-auto"
        class:btn-success={isCopied}
        class:btn-primary={!isCopied}
        on:click={copyToClipboard}
    >
        <svg class="copy-icon" class:hide={isCopied} viewBox="0 0 16 16" width="16" height="16">
            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
        </svg>
        <svg class="check-icon" class:show={isCopied} viewBox="0 0 16 16" width="16" height="16">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 11.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
        </svg>
        <span class="copy-text">{isCopied ? 'Copied!' : 'Copy URL'}</span>
    </button>
</Modal>

<style>
    .share-icon {
        width: 16px;
        height: 16px;
    }
    
    .copy-icon, .check-icon {
        width: 16px;
        height: 16px;
        fill: currentColor;
        transition: opacity 0.2s;
    }
    
    .copy-icon.hide {
        opacity: 0;
        position: absolute;
    }
    
    .check-icon {
        opacity: 0;
        position: absolute;
    }
    
    .check-icon.show {
        opacity: 1;
        position: static;
    }
</style>