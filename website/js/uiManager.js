/**
 * uiManager.js
 * 
 * Manages user interface elements and interactions for the ZoomingOnline application.
 * Handles populating selectors, managing UI state, and clipboard functionality.
 */

/**
 * Populate the dropdown selectors for channel, TRC, and segment
 * based on the data dimensions from the loaded store
 * 
 * @param {Object} store - The Zarr array containing shape information
 */
export function populateSelectors(store) {
    // With zarrita.js, the shape is directly available as a property
    const shape = store.shape;
    const channels = shape[0];
    const trcs = shape[1];
    const segments = shape[2];
    
    // Helper function to create options for a select element
    const createOptions = (selectId, count, prefix) => {
        const select = d3.select(selectId);
        select.selectAll("option").remove();
        for (let i = 0; i < count; i++) {
            select.append("option").attr("value", i).text(`${prefix} ${i + 1}`);
        }
    };
    
    // Create options for each selector
    createOptions("#channel-select", channels, "Channel");
    createOptions("#trc-select", trcs, "TRC");
    createOptions("#segment-select", segments, "Segment");
    
    // Show the selection container now that options are populated
    document.getElementById('selection-container').style.display = 'block';
}

/**
 * Display the shareable link container with the current data URL
 * 
 * @param {string} dataUrl - URL of the currently loaded Zarr data
 */
export function showCopyLinkContainer(dataUrl) {
    // Create a shareable URL with the data parameter
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('data', dataUrl);
    const linkToShow = currentUrl.toString();
    
    // Update the UI to show the link
    document.getElementById('copy-link-content').textContent = linkToShow;
    document.getElementById('copy-link-container').style.display = 'block';
}

/**
 * Set up the copy link button with clipboard functionality
 * Includes visual feedback when the link is copied
 */
export function setupCopyLinkButton() {
    const copyButton = document.getElementById('copy-link-button');
    const copyIcon = copyButton.querySelector('.copy-icon');
    const checkIcon = copyButton.querySelector('.check-icon');
    const copyText = copyButton.querySelector('.copy-text');

    copyButton.addEventListener('click', async () => {
        const linkContent = document.getElementById('copy-link-content').textContent;
        
        try {
            // Use the Clipboard API if available
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