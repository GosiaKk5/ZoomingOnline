/**
 * timeUtils.js
 * 
 * Handles time-related functionality for the ZoomingOnline application.
 * Manages time step generation, zoom domain calculations, and slider configuration
 * for controlling the visualization's time ranges.
 */

// timeSteps will now be part of window.appState
// export const timeSteps = []; // No longer directly exported, accessed via window.appState.timeSteps

/**
 * Generate a comprehensive set of time step options across different units
 * Creates an array of time steps from nanoseconds to milliseconds
 * with appropriate scaling for use in zoom level controls
 */
export function generateTimeSteps() {
    // Populate window.appState.timeSteps directly
    if (window.appState.timeSteps.length > 0) return;
    
    // Define units and their conversion factors to microseconds
    const units = {'ms': 1e3, 'ns': 1e-3, 'µs': 1,};
    const bases = [1, 2, 5]; // Standard bases for logarithmic scale
    const addedValues = new Set(); // Track unique values to avoid duplicates

    // Generate time steps across multiple units and magnitudes
    for (const unit in units) {
        for (let mag = 1; mag <= 1000; mag *= 10) {
            // Skip ranges that would be excessive
            if (unit === 'ns' && mag > 500) continue;
            if (unit === 'ms' && mag > 5) continue;
            
            bases.forEach(base => {
                const val = base * mag;
                if (unit === 'ms' && val > 5) return;

                const value_us = val * units[unit];
                if (!addedValues.has(value_us)) {
                    window.appState.timeSteps.push({
                        label: `${val} ${unit}`,
                        value_us: value_us
                    });
                    addedValues.add(value_us);
                }
            });
        }
    }
    
    // Sort by increasing duration
    window.appState.timeSteps.sort((a, b) => a.value_us - b.value_us);
}

/**
 * Calculate current zoom domains based on slider positions
 * @returns {Object} - Contains zoom1Domain and zoom2Domain time ranges in microseconds
 */
export function getZoomDomains() {
    const plotConfig = window.appState.plotConfig; // Access plotConfig from global state
    if (!plotConfig) {
        console.error("getZoomDomains: plotConfig is not defined.");
        // Return a default or throw an error, depending on desired behavior
        return { zoom1Domain: [0, 1], zoom2Domain: [0, 1] };
    }

    const {total_time_us} = plotConfig;
    
    // Get zoom1 position (as percentage) and window size
    const zoom1Pos = +document.getElementById('zoom1-pos').value / 100;
    const zoom1_index = +document.getElementById('zoom1-window').value;
    // CRITICAL FIX: Ensure validTimeSteps is populated before access
    const zoom1_window_us = plotConfig.validTimeSteps[zoom1_index].value_us;

    // Get zoom2 position (as percentage) and window size
    const zoom2Pos = +document.getElementById('zoom2-pos').value / 100;
    const zoom2_index = +document.getElementById('zoom2-window').value;
    // CRITICAL FIX: Ensure validZoom2Steps is populated before access
    const zoom2_window_us = plotConfig.validZoom2Steps[zoom2_index].value_us;

    // Calculate zoom1 domain (time range) based on position and window size
    const zoom1HalfWidth_us = zoom1_window_us / 2;
    const zoom1Center_us = total_time_us * zoom1Pos;
    const zoom1Domain = [
        Math.max(0, zoom1Center_us - zoom1HalfWidth_us),
        Math.min(total_time_us, zoom1Center_us + zoom1HalfWidth_us)
    ];

    // Calculate zoom2 domain within zoom1 domain
    const zoom2Range_us = (zoom1Domain[1] - zoom1Domain[0]);
    const zoom2HalfWidth_us = zoom2_window_us / 2;
    const zoom2Center_us = zoom1Domain[0] + (zoom2Range_us * zoom2Pos);
    const zoom2Domain = [
        Math.max(zoom1Domain[0], zoom2Center_us - zoom2HalfWidth_us),
        Math.min(zoom1Domain[1], zoom2Center_us + zoom2HalfWidth_us)
    ];

    return {zoom1Domain, zoom2Domain};
}

/**
 * Setup the time sliders with appropriate ranges and initial values
 * Called once after plotData initializes the plotConfig
 */
export function setupTimeSliders() {
    const plotConfig = window.appState.plotConfig; // Access plotConfig from global state
    const total_time_us = plotConfig.total_time_us; // Get total_time_us from plotConfig

    const slider1 = d3.select("#zoom1-window");
    const valueSpan1 = d3.select("#zoom1-window-val");

    // Populate plotConfig.validTimeSteps using the globally available timeSteps
    // Filter to only include time steps that make sense for this dataset
    window.appState.plotConfig.validTimeSteps = window.appState.timeSteps.filter(step => step.value_us < total_time_us);

    // Configure zoom1 window slider
    slider1
        .attr('min', 0)
        .attr('max', window.appState.plotConfig.validTimeSteps.length - 1)
        .attr('step', 1)
        .property('value', Math.floor(window.appState.plotConfig.validTimeSteps.length / 2));

    valueSpan1.text(window.appState.plotConfig.validTimeSteps[slider1.property('value')].label);

    // Setup zoom2 slider based on zoom1 selection
    updateZoom2SliderRange();
}

/**
 * Update zoom2 slider range based on the current zoom1 window size
 * Ensures zoom2 can only show a subset of what's visible in zoom1
 */
export function updateZoom2SliderRange() {
    const plotConfig = window.appState.plotConfig; // Access plotConfig from global state

    const slider1 = d3.select("#zoom1-window");
    const slider2 = d3.select("#zoom2-window");
    const valueSpan2 = d3.select("#zoom2-window-val");

    // Get current zoom1 window size and filter time steps
    const currentVal1_us = plotConfig.validTimeSteps[+slider1.property('value')].value_us;
    
    // Zoom2 can only show windows smaller than zoom1
    plotConfig.validZoom2Steps = plotConfig.validTimeSteps.filter(step => step.value_us < currentVal1_us);

    const currentVal2_idx = +slider2.property('value');

    // Configure zoom2 window slider
    slider2
        .attr('min', 0)
        .attr('max', plotConfig.validZoom2Steps.length - 1)
        .attr('step', 1);

    // If current value is out of range, adjust it
    let newIndex = currentVal2_idx;
    if (newIndex >= plotConfig.validZoom2Steps.length) {
        newIndex = Math.max(0, plotConfig.validZoom2Steps.length - 1);
        slider2.property('value', newIndex);
    }

    // Update display value
    if (plotConfig.validZoom2Steps.length > 0) {
        valueSpan2.text(plotConfig.validZoom2Steps[newIndex].label);
    } else {
        valueSpan2.text('');
    }
}