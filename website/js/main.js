import { plotData, updateAllCharts, updateZoom2Chart, plotConfig } from './chartRenderer.js';
import { loadZarrData, getRawDataSlice, zarrGroup, rawStore, overviewStore } from './dataLoader.js';
import { generateTimeSteps, setupTimeSliders, updateZoom2SliderRange, timeSteps } from './timeUtils.js';
import { populateSelectors, setupCopyLinkButton, showCopyLinkContainer } from './uiManager.js';

// Expose plotConfig to other modules if needed (e.g., for direct modification)
export { plotConfig };

// Global state variables (if truly needed across modules without explicit passing)
// In a more complex app, consider a state management pattern.
window.appState = {
    zarrGroup: null,
    rawStore: null,
    overviewStore: null,
    plotConfig: null,
    lastChunkCache: { key: null, data: null },
    timeSteps: timeSteps // Referencing the array from timeUtils
};


async function initialize() {
    generateTimeSteps();
    setupCopyLinkButton();

    const urlParams = new URLSearchParams(window.location.search);
    const dataUrl = urlParams.get('data');

    const handleLoadData = async (url) => {
        document.getElementById('input-container').style.display = 'none';
        try {
            await loadZarrData(url); // This will update appState.zarrGroup, etc.
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
        // Pass necessary data from appState to plotData
        await plotData(
            window.appState.rawStore,
            window.appState.zarrGroup,
            window.appState.overviewStore,
            window.appState.lastChunkCache,
            window.appState.timeSteps
        );
        // After plotData sets plotConfig, we can set up sliders
        setupTimeSliders(window.appState.plotConfig.total_time_us, window.appState.plotConfig.validTimeSteps);
    });

    document.getElementById('plot-another-btn-header').addEventListener('click', () => {
        window.location.href = 'https://datamedsci.github.io/ZoomingOnline';
    });

    // Position Sliders
    d3.select('#zoom1-pos').on('change', updateAllCharts);
    d3.select('#zoom2-pos').on('change', updateZoom2Chart);

    // Window Sliders
    d3.select('#zoom1-window').on('change', () => {
        updateZoom2SliderRange(window.appState.plotConfig.validTimeSteps, window.appState.plotConfig.validZoom2Steps);
        updateAllCharts();
    });
    d3.select('#zoom2-window').on('change', updateZoom2Chart);

    // Input feedback for sliders
    d3.select('#zoom1-window').on('input', () => {
        const slider = d3.select('#zoom1-window');
        d3.select('#zoom1-window-val').text(window.appState.plotConfig.validTimeSteps[+slider.property('value')].label);
    });
    d3.select('#zoom2-window').on('input', () => {
        const slider = d3.select('#zoom2-window');
        if (window.appState.plotConfig.validZoom2Steps.length > 0) {
            d3.select('#zoom2-window-val').text(window.appState.plotConfig.validZoom2Steps[+slider.property('value')].label);
        }
    });
    d3.select('#zoom1-pos').on('input', () => d3.select('#zoom1-pos-val').text(d3.select('#zoom1-pos').property('value') + '%'));
    d3.select('#zoom2-pos').on('input', () => d3.select('#zoom2-pos-val').text(d3.select('#zoom2-pos').property('value') + '%'));
}

initialize();