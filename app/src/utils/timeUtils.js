/**
 * timeUtils.js
 * 
 * Handles time-related functionality for the ZoomingOnline application.
 * Manages time step generation, zoom domain calculations, and slider configuration
 * for controlling the visualization's time ranges.
 * Adapted for Svelte store-based state management.
 */

import { timeSteps, plotConfig } from '../stores/appStore.js';
import { get } from 'svelte/store';

/**
 * Generate a comprehensive set of time step options across different units
 * Creates an array of time steps from nanoseconds to milliseconds
 * with appropriate scaling for use in zoom level controls
 */
export function generateTimeSteps() {
    const currentSteps = get(timeSteps);
    if (currentSteps.length > 0) return;
    
    // Define units and their conversion factors to microseconds
    const units = {'ms': 1e3, 'ns': 1e-3, 'µs': 1,};
    const bases = [1, 2, 5]; // Standard bases for logarithmic scale
    const addedValues = new Set(); // Track unique values to avoid duplicates
    const newTimeSteps = [];

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
                    newTimeSteps.push({
                        label: `${val} ${unit}`,
                        value_us: value_us
                    });
                    addedValues.add(value_us);
                }
            });
        }
    }
    
    // Sort by increasing duration and update store
    newTimeSteps.sort((a, b) => a.value_us - b.value_us);
    timeSteps.set(newTimeSteps);
}

/**
 * Calculate current zoom domains based on slider positions
 * @param {number} zoom1Pos - Zoom1 position percentage (0-100)
 * @param {number} zoom1WindowIndex - Index in validTimeSteps array
 * @param {number} zoom2Pos - Zoom2 position percentage (0-100)
 * @param {number} zoom2WindowIndex - Index in validZoom2Steps array
 * @returns {Object} - Contains zoom1Domain and zoom2Domain time ranges in microseconds
 */
export function getZoomDomains(zoom1Pos, zoom1WindowIndex, zoom2Pos, zoom2WindowIndex) {
    const config = get(plotConfig);
    if (!config || !config.validTimeSteps || !config.validZoom2Steps) {
        console.error("getZoomDomains: plotConfig or time steps are not defined.");
        return { zoom1Domain: [0, 1], zoom2Domain: [0, 1] };
    }

    const { total_time_us, validTimeSteps, validZoom2Steps } = config;
    
    // Get window sizes from arrays
    const zoom1_window_us = validTimeSteps[zoom1WindowIndex]?.value_us || 0;
    const zoom2_window_us = validZoom2Steps[zoom2WindowIndex]?.value_us || 0;

    // Calculate zoom1 domain (time range) based on position and window size
    const zoom1HalfWidth_us = zoom1_window_us / 2;
    const zoom1Center_us = total_time_us * (zoom1Pos / 100);
    const zoom1Domain = [
        Math.max(0, zoom1Center_us - zoom1HalfWidth_us),
        Math.min(total_time_us, zoom1Center_us + zoom1HalfWidth_us)
    ];

    // Calculate zoom2 domain within zoom1 domain
    const zoom2Range_us = (zoom1Domain[1] - zoom1Domain[0]);
    const zoom2HalfWidth_us = zoom2_window_us / 2;
    const zoom2Center_us = zoom1Domain[0] + (zoom2Range_us * (zoom2Pos / 100));
    const zoom2Domain = [
        Math.max(zoom1Domain[0], zoom2Center_us - zoom2HalfWidth_us),
        Math.min(zoom1Domain[1], zoom2Center_us + zoom2HalfWidth_us)
    ];

    return { zoom1Domain, zoom2Domain };
}

/**
 * Setup the time sliders with appropriate ranges and initial values
 * Called once after plotData initializes the plotConfig
 * @param {number} totalTimeUs - Total time duration in microseconds
 * @returns {Object} - Contains validTimeSteps and validZoom2Steps
 */
export function setupTimeSliders(totalTimeUs) {
    const currentTimeSteps = get(timeSteps);
    
    // Filter to only include time steps that make sense for this dataset
    const validTimeSteps = currentTimeSteps.filter(step => step.value_us < totalTimeUs);
    
    // Initially, zoom2 can show all valid time steps (will be filtered when zoom1 changes)
    const validZoom2Steps = [...validTimeSteps];
    
    // Update plot config with valid time steps
    plotConfig.update(config => ({
        ...config,
        total_time_us: totalTimeUs,
        validTimeSteps,
        validZoom2Steps
    }));
    
    return { validTimeSteps, validZoom2Steps };
}

/**
 * Update zoom2 slider range based on the current zoom1 window size
 * @param {number} zoom1WindowIndex - Current zoom1 window index
 * @returns {Array} - Updated validZoom2Steps array
 */
export function updateZoom2SliderRange(zoom1WindowIndex) {
    const config = get(plotConfig);
    if (!config.validTimeSteps || zoom1WindowIndex >= config.validTimeSteps.length) {
        return [];
    }
    
    // Get current zoom1 window size and filter time steps
    const currentVal1_us = config.validTimeSteps[zoom1WindowIndex].value_us;
    
    // Zoom2 can only show windows smaller than zoom1
    const validZoom2Steps = config.validTimeSteps.filter(step => step.value_us < currentVal1_us);
    
    // Update plot config
    plotConfig.update(config => ({
        ...config,
        validZoom2Steps
    }));
    
    return validZoom2Steps;
}

/**
 * Get formatted time label for a time step value
 * @param {number} valueUs - Time value in microseconds
 * @returns {string} - Formatted label (e.g., "10 µs", "1 ms")
 */
export function formatTimeLabel(valueUs) {
    const currentTimeSteps = get(timeSteps);
    const step = currentTimeSteps.find(s => s.value_us === valueUs);
    return step ? step.label : `${valueUs} µs`;
}
