export function populateSelectors(store) {
    const [channels, trcs, segments] = store.shape;
    const createOptions = (selectId, count, prefix) => {
        const select = d3.select(selectId);
        select.selectAll("option").remove();
        for (let i = 0; i < count; i++) {
            select.append("option").attr("value", i).text(`${prefix} ${i + 1}`);
        }
    };
    createOptions("#channel-select", channels, "Channel");
    createOptions("#trc-select", trcs, "TRC");
    createOptions("#segment-select", segments, "Segment");
    document.getElementById('selection-container').style.display = 'block';
}

export function showCopyLinkContainer(dataUrl) {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('data', dataUrl);
    const linkToShow = currentUrl.toString();
    
    document.getElementById('copy-link-content').textContent = linkToShow;
    document.getElementById('copy-link-container').style.display = 'block';
}

export function setupCopyLinkButton() {
    const copyButton = document.getElementById('copy-link-button');
    const copyIcon = copyButton.querySelector('.copy-icon');
    const checkIcon = copyButton.querySelector('.check-icon');
    const copyText = copyButton.querySelector('.copy-text');

    copyButton.addEventListener('click', async () => {
        const linkContent = document.getElementById('copy-link-content').textContent;
        
        try {
            await navigator.clipboard.writeText(linkContent);
            
            // Show success state
            copyButton.classList.add('copied');
            copyIcon.style.display = 'none';
            checkIcon.style.display = 'inline';
            copyText.textContent = 'Copied!';
            
            // Reset after 2 seconds
            setTimeout(() => {
                copyButton.classList.remove('copied');
                copyIcon.style.display = 'inline';
                checkIcon.style.display = 'none';
                copyText.textContent = 'Copy';
            }, 2000);
            
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = linkContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Show success state
            copyText.textContent = 'Copied!';
            setTimeout(() => {
                copyText.textContent = 'Copy';
            }, 2000);
        }
    });
}