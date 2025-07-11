import { plotData, updateAllCharts, updateZoom2Chart } from './chartRenderer.js'; // Removed plotConfig import as it's accessed via window.appState
import { loadZarrData } from './dataLoader.js'; // Removed zarrGroup, rawStore, overviewStore, lastChunkCache imports as they are accessed via window.appState
import { generateTimeSteps, setupTimeSliders, updateZoom2SliderRange } from './timeUtils.js'; // Removed timeSteps import as it's accessed via window.appState
import { populateSelectors, setupCopyLinkButton, showCopyLinkContainer } from './uiManager.js';

// Initialize a global app state object
window.appState = {
    zarrGroup: null,
    rawStore: null,
    overviewStore: null,
    plotConfig: null, // This will be set by plotData
    lastChunkCache: { key: null, data: null },
    timeSteps: [] // This will be populated by generateTimeSteps
};

async function initialize() {
    // Generate time steps early, but store them in appState
    generateTimeSteps(); // This function now populates window.appState.timeSteps
    setupCopyLinkButton();

    const urlParams = new URLSearchParams(window.location.search);
    const dataUrl = urlParams.get('data');

    const handleLoadData = async (url) => {
        document.getElementById('input-container').style.display = 'none';
        try {
            await loadZarrData(url); // This updates appState.zarrGroup, rawStore, etc.
            populateSelectors(window.appState.rawStore);
            showCopyLinkContainer(url);
        } catch (error) {
            const container = document.getElementById('selection-container');
            container.innerHTML = `<div style="color: red; text-align: center; padding: 2rem;"><h3>Error</h3><p>${error.message}</p></div>`;
            container.style.display = 'block';
        }
    };

    if (dataUrl) handleLoadData(dataUrl);
    else document.getElementById('input-container').style.display = 'block';

    // Event Listeners
    document.getElementById('load-button').addEventListener('click', () => {
        const dataUrlInput = document.getElementById('zarr-input').value;
        if (dataUrlInput) {
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('data', dataUrlInput);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);
            handleLoadData(dataUrlInput);
        }
    });

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

    document.getElementById('plot-another-btn-header').addEventListener('click', () => {
        window.location.href = 'https://datamedsci.github.io/ZoomingOnline';
    });

    // Position Sliders
    d3.select('#zoom1-pos').on('change', updateAllCharts);
    d3.select('#zoom2-pos').on('change', updateZoom2Chart);

    // Window Sliders
    d3.select('#zoom1-window').on('change', () => {
        updateZoom2SliderRange(); // Now uses window.appState.plotConfig
        updateAllCharts();
    });
    d3.select('#zoom2-window').on('change', updateZoom2Chart);

    // Input feedback for sliders
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

initialize();