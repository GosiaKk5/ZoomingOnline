<script>
    import { showCopyLink, currentDataUrl } from '../stores/appStore.ts';
    
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
    
    // Close modal when clicking outside
    function handleModalClick(event) {
        if (event.target === event.currentTarget) {
            closeModal();
        }
    }
    
    // Handle keyboard events for accessibility
    function handleKeydown(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
    
    function handleBackdropKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            if (event.target === event.currentTarget) {
                closeModal();
            }
        }
    }
</script>

{#if $showCopyLink}
    <button class="share-button" on:click={openModal}>
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

{#if showModal}
    <!-- Modal backdrop -->
    <div 
        class="modal-backdrop" 
        role="button"
        tabindex="0"
        on:click={handleModalClick}
        on:keydown={handleBackdropKeydown}
    >
        <!-- Modal content -->
        <div 
            class="modal-content" 
            role="dialog"
            aria-labelledby="modal-title"
        >
            <!-- Modal header -->
            <div class="modal-header">
                <h2 id="modal-title" class="modal-title">Share Dataset</h2>
                <button class="close-button" on:click={closeModal}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <!-- Modal body -->
            <div class="modal-body">
                <p class="description">Copy this URL to share the current dataset and visualization settings with others:</p>
                
                <div class="url-container">
                    <input 
                        type="text" 
                        class="url-input" 
                        value={shareableUrl} 
                        readonly
                        on:focus={(e) => e.target.select()}
                    />
                </div>
                
                <button 
                    class="copy-button" 
                    class:copied={isCopied}
                    on:click={copyToClipboard}
                >
                    <svg class="copy-icon" class:hide={isCopied} viewBox="0 0 16 16">
                        <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
                        <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                    </svg>
                    <svg class="check-icon" class:show={isCopied} viewBox="0 0 16 16">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 11.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                    </svg>
                    <span class="copy-text">{isCopied ? 'Copied!' : 'Copy URL'}</span>
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .share-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .share-button:hover {
        background: #0056b3;
    }
    
    .share-icon {
        width: 16px;
        height: 16px;
    }
    
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 2rem;
    }
    
    .modal-content {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow: hidden;
    }
    
    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        margin: 0;
    }
    
    .close-button {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: background-color 0.2s;
    }
    
    .close-button:hover {
        background: #f3f4f6;
        color: #111827;
    }
    
    .close-button svg {
        width: 20px;
        height: 20px;
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .description {
        color: #6b7280;
        margin: 0 0 1.5rem 0;
        font-size: 0.875rem;
        line-height: 1.5;
    }
    
    .url-container {
        margin-bottom: 1.5rem;
    }
    
    .url-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
        font-size: 0.875rem;
        color: #111827;
        background: #f9fafb;
        transition: border-color 0.2s;
    }
    
    .url-input:focus {
        outline: none;
        border-color: #007bff;
        background: white;
    }
    
    .copy-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        margin: 0 auto;
    }
    
    .copy-button:hover {
        background: #0056b3;
    }
    
    .copy-button.copied {
        background: #10b981;
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
    
    @media (max-width: 768px) {
        .modal-backdrop {
            padding: 1rem;
        }
        
        .modal-content {
            max-height: 90vh;
        }
        
        .modal-header,
        .modal-body {
            padding: 1rem;
        }
        
        .url-input {
            font-size: 0.75rem;
        }
    }
</style>