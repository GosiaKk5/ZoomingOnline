<script>
    import { showCopyLink, currentDataUrl } from '../stores/appStore.js';
    
    let isCopied = false;
    
    $: shareableUrl = $currentDataUrl ? 
        `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent($currentDataUrl)}` : '';
    
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

{#if $showCopyLink && shareableUrl}
    <div class="copy-link-container">
        <div class="copy-link-header">
            <h4 class="copy-link-title">This dataset:</h4>
            <div class="copy-link-content">{shareableUrl}</div>
            <button 
                class="copy-link-button" 
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
                <span class="copy-text">{isCopied ? 'Copied!' : 'Copy'}</span>
            </button>
        </div>
    </div>
{/if}

<style>
    .copy-link-container {
        background: #f6f8fa;
        border: 1px solid #d1d9e0;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1rem;
        position: relative;
    }

    .copy-link-header {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .copy-link-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #656d76;
        margin: 0;
        white-space: nowrap;
    }

    .copy-link-button {
        background: #f6f8fa;
        border: 1px solid #d1d9e0;
        border-radius: 6px;
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        color: #656d76;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .copy-link-button:hover {
        background: #eaeef2;
        border-color: #afb8c1;
    }

    .copy-link-button.copied {
        background: #dafbe1;
        border-color: #2da44e;
        color: #2da44e;
    }

    .copy-link-content {
        background: white;
        border: 1px solid #d1d9e0;
        border-radius: 6px;
        padding: 0.75rem;
        font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
        font-size: 0.6rem;
        color: #1f2328;
        overflow-x: auto;
        white-space: nowrap;
        flex: 1;
    }

    .copy-icon, .check-icon {
        width: 14px;
        height: 14px;
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
