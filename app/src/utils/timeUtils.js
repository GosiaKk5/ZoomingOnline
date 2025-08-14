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
    console.log('⏰ generateTimeSteps() called');
    
    const currentSteps = get(timeSteps);
    console.log('  - Current time steps length:', currentSteps.length);
    
    if (currentSteps.length > 0) {
        console.log('  - Time steps already exist, skipping generation');
        return;
    }
    
    console.log('  - Generating new time steps...');
    
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
    console.log('  - Generated time steps count:', newTimeSteps.length);
    console.log('  - Sample time steps:', newTimeSteps.slice(0, 10));
    
    timeSteps.set(newTimeSteps);
    console.log('✅ Time steps generated and stored');
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
    console.log('🔍 getZoomDomains() called');
    console.log('  - zoom1Pos:', zoom1Pos, 'zoom1WindowIndex:', zoom1WindowIndex);
    console.log('  - zoom2Pos:', zoom2Pos, 'zoom2WindowIndex:', zoom2WindowIndex);
    
    // Validate input parameters
    const zoom1PosValid = !isNaN(zoom1Pos) && isFinite(zoom1Pos);
    const zoom1IndexValid = !isNaN(zoom1WindowIndex) && isFinite(zoom1WindowIndex) && zoom1WindowIndex >= 0;
    const zoom2PosValid = !isNaN(zoom2Pos) && isFinite(zoom2Pos);
    const zoom2IndexValid = !isNaN(zoom2WindowIndex) && isFinite(zoom2WindowIndex) && zoom2WindowIndex >= 0;
    
    console.log('  - zoom1Pos valid:', zoom1PosValid);
    console.log('  - zoom1WindowIndex valid:', zoom1IndexValid);
    console.log('  - zoom2Pos valid:', zoom2PosValid);
    console.log('  - zoom2WindowIndex valid:', zoom2IndexValid);
    
    // Use defaults for invalid parameters
    const safeZoom1Pos = zoom1PosValid ? zoom1Pos : 50;
    const safeZoom1Index = zoom1IndexValid ? zoom1WindowIndex : 0;
    const safeZoom2Pos = zoom2PosValid ? zoom2Pos : 50;
    const safeZoom2Index = zoom2IndexValid ? zoom2WindowIndex : 0;
    
    console.log('  - Using safe values:');
    console.log('    - safeZoom1Pos:', safeZoom1Pos);
    console.log('    - safeZoom1Index:', safeZoom1Index);
    console.log('    - safeZoom2Pos:', safeZoom2Pos);
    console.log('    - safeZoom2Index:', safeZoom2Index);
    
    const config = get(plotConfig);
    console.log('  - config exists:', !!config);
    console.log('  - config.validTimeSteps exists:', !!config?.validTimeSteps);
    console.log('  - config.validZoom2Steps exists:', !!config?.validZoom2Steps);
    console.log('  - config.total_time_us:', config?.total_time_us);
    
    if (!config || !config.validTimeSteps || !config.validZoom2Steps) {
        console.error("❌ getZoomDomains: plotConfig or time steps are not defined.");
        console.error("  - config:", config);
        return { zoom1Domain: [0, 1], zoom2Domain: [0, 1] };
    }

    const { total_time_us, validTimeSteps, validZoom2Steps } = config;
    console.log('  - total_time_us:', total_time_us);
    console.log('  - validTimeSteps length:', validTimeSteps.length);
    console.log('  - validZoom2Steps length:', validZoom2Steps.length);
    
    // Get window sizes from arrays with safe indexing
    const zoom1_window_us = validTimeSteps[safeZoom1Index]?.value_us || validTimeSteps[0]?.value_us || 1000;
    const zoom2_window_us = validZoom2Steps[safeZoom2Index]?.value_us || validZoom2Steps[0]?.value_us || 100;
    
    console.log('  - validTimeSteps sample:', validTimeSteps.slice(0, 3));
    console.log('  - validZoom2Steps sample:', validZoom2Steps.slice(0, 3));
    console.log('  - zoom1_window_us (from index', safeZoom1Index, '):', zoom1_window_us);
    console.log('  - zoom2_window_us (from index', safeZoom2Index, '):', zoom2_window_us);

    // Calculate zoom1 domain (time range) based on position and window size
    const zoom1HalfWidth_us = zoom1_window_us / 2;
    const zoom1Center_us = total_time_us * (safeZoom1Pos / 100);
    const zoom1Domain = [
        Math.max(0, zoom1Center_us - zoom1HalfWidth_us),
        Math.min(total_time_us, zoom1Center_us + zoom1HalfWidth_us)
    ];

    console.log('  - zoom1 calculations:');
    console.log('    - zoom1HalfWidth_us:', zoom1HalfWidth_us);
    console.log('    - zoom1Center_us:', zoom1Center_us);
    console.log('    - zoom1Domain before bounds:', [zoom1Center_us - zoom1HalfWidth_us, zoom1Center_us + zoom1HalfWidth_us]);

    // Calculate zoom2 domain within zoom1 domain
    const zoom2Range_us = (zoom1Domain[1] - zoom1Domain[0]);
    const zoom2HalfWidth_us = zoom2_window_us / 2;
    const zoom2Center_us = zoom1Domain[0] + (zoom2Range_us * (safeZoom2Pos / 100));
    const zoom2Domain = [
        Math.max(zoom1Domain[0], zoom2Center_us - zoom2HalfWidth_us),
        Math.min(zoom1Domain[1], zoom2Center_us + zoom2HalfWidth_us)
    ];

    console.log('  - zoom2 calculations:');
    console.log('    - zoom2Range_us:', zoom2Range_us);
    console.log('    - zoom2HalfWidth_us:', zoom2HalfWidth_us);
    console.log('    - zoom2Center_us:', zoom2Center_us);
    console.log('    - zoom2Domain before bounds:', [zoom2Center_us - zoom2HalfWidth_us, zoom2Center_us + zoom2HalfWidth_us]);

    console.log('📊 Calculated domains:');
    console.log('  - zoom1Domain:', zoom1Domain);
    console.log('  - zoom2Domain:', zoom2Domain);
    
    return { zoom1Domain, zoom2Domain };
}

/**
 * Setup the time sliders with appropriate ranges and initial values
 * Called once after plotData initializes the plotConfig
 * @param {number} totalTimeUs - Total time duration in microseconds
 * @returns {Object} - Contains validTimeSteps and validZoom2Steps
 */
export function setupTimeSliders(totalTimeUs) {
    console.log('🎛️ setupTimeSliders() called');
    console.log('  - totalTimeUs parameter:', totalTimeUs);
    console.log('  - totalTimeUs type:', typeof totalTimeUs);
    console.log('  - totalTimeUs is valid number:', !isNaN(totalTimeUs) && isFinite(totalTimeUs));
    
    const currentTimeSteps = get(timeSteps);
    console.log('  - Available time steps count:', currentTimeSteps.length);
    console.log('  - Sample time steps:', currentTimeSteps.slice(0, 5));
    
    if (!totalTimeUs || isNaN(totalTimeUs) || !isFinite(totalTimeUs)) {
        console.error('❌ setupTimeSliders: Invalid totalTimeUs value');
        console.error('  - Received value:', totalTimeUs);
        return { validTimeSteps: [], validZoom2Steps: [] };
    }
    
    // Filter to only include time steps that make sense for this dataset
    const validTimeSteps = currentTimeSteps.filter(step => step.value_us < totalTimeUs);
    console.log('  - Valid time steps count:', validTimeSteps.length);
    console.log('  - Valid time steps sample:', validTimeSteps.slice(0, 5));
    
    // Initially, zoom2 can show all valid time steps (will be filtered when zoom1 changes)
    const validZoom2Steps = [...validTimeSteps];
    console.log('  - Valid zoom2 steps count:', validZoom2Steps.length);
    
    // Update plot config with valid time steps
    console.log('📊 Updating plot config...');
    plotConfig.update(config => {
        const newConfig = {
            ...config,
            total_time_us: totalTimeUs,
            validTimeSteps,
            validZoom2Steps
        };
        console.log('  - Updated config total_time_us:', newConfig.total_time_us);
        console.log('  - Updated config validTimeSteps count:', newConfig.validTimeSteps.length);
        console.log('  - Updated config validZoom2Steps count:', newConfig.validZoom2Steps.length);
        return newConfig;
    });
    
    console.log('✅ setupTimeSliders completed');
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
