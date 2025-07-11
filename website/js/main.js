/**
 * main.js
 * 
 * Main application entry point that initializes the ZoomingOnline application.
 * Coordinates between different modules, sets up the global application state,
 * and handles event listeners for user interaction.
 */

import { plotData, updateAllCharts, updateZoom2Chart } from './chartRenderer.js'; 
import { loadZarrData } from './dataLoader.js'; 
import { generateTimeSteps, setupTimeSliders, updateZoom2SliderRange } from './timeUtils.js'; 
import { populateSelectors, setupCopyLinkButton, showCopyLinkContainer } from './uiManager.js';

// Initialize a global app state object for sharing data between modules
window.appState = {
    zarrGroup: null,
    rawStore: null,
    overviewStore: null,
    plotConfig: null, // This will be set by plotData
    lastChunkCache: { key: null, data: null },
    timeSteps: [] // This will be populated by generateTimeSteps
};

/**
 * Initialize the application, set up event listeners, and handle URL parameters
 */
async function initialize() {
    // Generate time steps early, but store them in window.appState.timeSteps
    generateTimeSteps();
    setupCopyLinkButton();

    // Check if a data URL was provided in the query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const dataUrl = urlParams.get('data');

    /**
     * Handle data loading process
     * @param {string} url - URL of the Zarr data to load
     */
    const handleLoadData = async (url) => {
        document.getElementById('input-container').style.display = 'none';
        try {
            // Load the data and update global state
            await loadZarrData(url); // This updates appState.zarrGroup, rawStore, etc.
            populateSelectors(window.appState.rawStore);
            showCopyLinkContainer(url);
        } catch (error) {
            // Display error message if data loading fails
            const container = document.getElementById('selection-container');
            container.innerHTML = `<div style="color: red; text-align: center; padding: 2rem;"><h3>Error</h3><p>${error.message}</p></div>`;
            container.style.display = 'block';
        }
    };

    // If data URL is provided in URL params, load it directly
    if (dataUrl) handleLoadData(dataUrl);
    else document.getElementById('input-container').style.display = 'block';

    // Event Listeners
    
    // Load button click handler - loads data from user-provided URL
    document.getElementById('load-button').addEventListener('click', () => {
        const dataUrlInput = document.getElementById('zarr-input').value;
        if (dataUrlInput) {
            // Update URL with the data parameter for shareable links
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('data', dataUrlInput);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            handleLoadData(dataUrlInput);
        }
    });

    // Plot button click handler - initializes visualization
    document.getElementById('plot-button').addEventListener('click', async () => {
        // Call plotData to initialize plotConfig (including total_time_us)
        await plotData(
            window.appState.rawStore,
            window.appState.zarrGroup,
            window.appState.overviewStore,
            window.appState.lastChunkCache // Still passing directly for now, can be refactored
        );

        // NOW that plotConfig and total_time_us are set, setup the time sliders
        setupTimeSliders(); // This function will now use window.appState.plotConfig and window.appState.timeSteps

        // And then update all charts (which relies on initialized sliders)
        await updateAllCharts();
    });

    // Button to return to landing page for plotting different data
    document.getElementById('plot-another-btn-header').addEventListener('click', () => {
        window.location.href = 'https://datamedsci.github.io/ZoomingOnline';
    });

    // Position Sliders - handle moving the view within the same zoom level
    d3.select('#zoom1-pos').on('change', updateAllCharts);
    d3.select('#zoom2-pos').on('change', updateZoom2Chart);

    // Window Sliders - handle changing the zoom level/magnification
    d3.select('#zoom1-window').on('change', () => {
        updateZoom2SliderRange(); // Now uses window.appState.plotConfig
        updateAllCharts();
    });
    d3.select('#zoom2-window').on('change', updateZoom2Chart);

    // Input feedback for sliders - update the display values as sliders move
    d3.select('#zoom1-window').on('input', () => {
        const slider = d3.select('#zoom1-window');
        // Ensure validTimeSteps is available before trying to access it
        if (window.appState.plotConfig && window.appState.plotConfig.validTimeSteps) {
            d3.select('#zoom1-window-val').text(window.appState.plotConfig.validTimeSteps[+slider.property('value')].label);
        }
    });
    d3.select('#zoom2-window').on('input', () => {
        const slider = d3.select('#zoom2-window');
        // Ensure validZoom2Steps is available before trying to access it
        if (window.appState.plotConfig && window.appState.plotConfig.validZoom2Steps && window.appState.plotConfig.validZoom2Steps.length > 0) {
            d3.select('#zoom2-window-val').text(window.appState.plotConfig.validZoom2Steps[+slider.property('value')].label);
        }
    });
    d3.select('#zoom1-pos').on('input', () => d3.select('#zoom1-pos-val').text(d3.select('#zoom1-pos').property('value') + '%'));
    d3.select('#zoom2-pos').on('input', () => d3.select('#zoom2-pos-val').text(d3.select('#zoom2-pos').property('value') + '%'));
}

// Start the application
initialize();