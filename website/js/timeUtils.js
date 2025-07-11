/**
 * timeUtils.js
 * 
 * Handles time-related functionality for the ZoomingOnline application.
 * Manages time step generation, zoom domain calculations, and slider configuration
 * for controlling the visualization's time ranges.
 */

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
 * Implements custom sliders with bullet points for window size controls
 */
export function setupTimeSliders() {
    const plotConfig = window.appState.plotConfig; // Access plotConfig from global state
    const total_time_us = plotConfig.total_time_us; // Get total_time_us from plotConfig

    // Populate plotConfig.validTimeSteps using the globally available timeSteps
    // Filter to only include time steps that make sense for this dataset
    window.appState.plotConfig.validTimeSteps = window.appState.timeSteps.filter(step => step.value_us < total_time_us);

    // Get references to container elements for both window sliders
    const zoom1WindowContainer = d3.select('#zoom1-window').node().parentNode;
    const zoom2WindowContainer = d3.select('#zoom2-window').node().parentNode;

    // Hide the original slider inputs but keep them in the DOM for compatibility
    d3.select('#zoom1-window').style('display', 'none');
    d3.select('#zoom2-window').style('display', 'none');

    // Setup zoom1 window slider (custom implementation with bullets)
    createCustomSlider(
        zoom1WindowContainer, 
        '#zoom1-window', 
        '#zoom1-window-val', 
        window.appState.plotConfig.validTimeSteps, 
        Math.max(0, window.appState.plotConfig.validTimeSteps.length - 7),
        'zoom1'
    );

    // Update zoom2 slider based on zoom1 selection
    updateZoom2SliderRange();
}

/**
 * Creates a custom slider with bullet points for each step
 * Each bullet represents a possible window size value
 * 
 * @param {HTMLElement} container - The parent container where slider will be placed
 * @param {string} originalSliderId - Selector for the original input slider
 * @param {string} valueLabelId - Selector for the value display element
 * @param {Array} steps - Array of possible step values
 * @param {number} initialIndex - Initial selected step index
 * @param {string} sliderId - Unique identifier for this slider
 * @returns {HTMLElement} - The created custom slider container
 */
function createCustomSlider(container, originalSliderId, valueLabelId, steps, initialIndex, sliderId) {
    // Create container for custom slider
    const customSliderContainer = document.createElement('div');
    customSliderContainer.className = 'custom-slider-container';
    customSliderContainer.id = `${sliderId}-custom-container`;
    
    // Create track
    const track = document.createElement('div');
    track.className = 'custom-slider-track';
    customSliderContainer.appendChild(track);
    
    // Original slider element (kept for compatibility)
    const originalSlider = d3.select(originalSliderId).node();
    
    // Insert custom slider after the original (hidden) slider
    container.insertBefore(customSliderContainer, d3.select(valueLabelId).node());
    
    // Track which bullet should display labels
    const labelsToShow = new Set();
    
    // Always show labels for first and last positions
    labelsToShow.add(0);
    labelsToShow.add(steps.length - 1);
    
    // Find round numbers (1ns, 10ns, 100ns, 1µs, 10µs, etc.) to show labels for
    steps.forEach((step, index) => {
        const match = step.label.match(/^(1|10|100|1000) (ns|µs|ms)$/);
        if (match) {
            labelsToShow.add(index);
        }
    });
    
    // Track the current dragging state
    let isDragging = false;
    let activeBullet = null;
    
    // Function to get nearest valid index position for a given x coordinate
    const getNearestIndex = (x) => {
        // Calculate relative position (0-1)
        const containerRect = customSliderContainer.getBoundingClientRect();
        const trackWidth = containerRect.width - 20; // Account for padding
        const relativeX = (x - containerRect.left - 10) / trackWidth;
        
        // Clamp between 0 and 1
        const clamped = Math.max(0, Math.min(1, relativeX));
        
        // Find closest step
        const position = clamped * (steps.length - 1);
        return Math.round(position);
    };
    
    // Function to highlight the bullet being hovered over during dragging
    const highlightNearestBullet = (x) => {
        if (!isDragging) return;
        
        const nearestIndex = getNearestIndex(x);
        
        // Add a visual indicator of which bullet will be selected
        customSliderContainer.querySelectorAll('.custom-slider-bullet').forEach((bullet, idx) => {
            if (idx === nearestIndex) {
                bullet.style.transform = 'translateX(-50%) scale(1.2)';
            } else {
                bullet.style.transform = 'translateX(-50%) scale(1.0)';
            }
        });
    };
    
    // Create bullets
    steps.forEach((step, index) => {
        const bullet = document.createElement('div');
        bullet.className = 'custom-slider-bullet';
        bullet.setAttribute('data-index', index);
        bullet.setAttribute('data-value', step.value_us);
        bullet.setAttribute('title', step.label);
        
        // Position bullet along the track
        const position = (index / (steps.length - 1)) * 100;
        bullet.style.left = `${position}%`;
        
        // Add label if this is a round number, first, or last position
        if (labelsToShow.has(index)) {
            const label = document.createElement('div');
            label.className = 'custom-slider-label';
            label.textContent = step.label;
            label.style.left = `${position}%`;
            customSliderContainer.appendChild(label);
        }
        
        // Set active class for initial selection
        if (index === initialIndex) {
            bullet.classList.add('active');
            activeBullet = bullet;
            // Update the original slider value and display
            originalSlider.value = index;
            d3.select(valueLabelId).text(step.label);
        }
        
        // Add click event listener
        bullet.addEventListener('click', (event) => {
            if (!isDragging) {
                // Update active bullet
                customSliderContainer.querySelectorAll('.custom-slider-bullet').forEach(b => {
                    b.classList.remove('active');
                });
                bullet.classList.add('active');
                activeBullet = bullet;
                
                // Update original slider value
                originalSlider.value = index;
                
                // Update display value
                d3.select(valueLabelId).text(step.label);
                
                // Trigger change event on original slider
                originalSlider.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        // Add mouseover handler to show value in the display span
        bullet.addEventListener('mouseover', () => {
            // Update display value temporarily only if not dragging
            if (!isDragging) {
                d3.select(valueLabelId).text(step.label);
            }
        });
        
        // Add mouseout handler to restore display to selected value
        bullet.addEventListener('mouseout', () => {
            // Restore to the active bullet's value only if not dragging
            if (!isDragging && activeBullet) {
                const activeIndex = parseInt(activeBullet.getAttribute('data-index'), 10);
                d3.select(valueLabelId).text(steps[activeIndex].label);
            }
        });
        
        customSliderContainer.appendChild(bullet);
    });
    
    // Define event handlers outside so we can remove them later
    const handleMouseDown = (event) => {
        // Only start drag if we're clicking on the active bullet
        const targetBullet = event.target.closest('.custom-slider-bullet');
        if (targetBullet && targetBullet.classList.contains('active')) {
            isDragging = true;
            activeBullet = targetBullet;
            activeBullet.classList.add('dragging');
            event.preventDefault();
        }
    };
    
    const handleMouseMove = (event) => {
        if (isDragging && activeBullet) {
            // Always highlight the nearest bullet while dragging
            highlightNearestBullet(event.clientX);
            
            const newIndex = getNearestIndex(event.clientX);
            const currentIndex = parseInt(activeBullet.getAttribute('data-index'), 10);
            
            if (newIndex !== currentIndex) {
                // Remove active class from current bullet
                activeBullet.classList.remove('active', 'dragging');
                
                // Find the new bullet and make it active
                const newBullet = customSliderContainer.querySelector(`.custom-slider-bullet[data-index="${newIndex}"]`);
                if (newBullet) {
                    newBullet.classList.add('active', 'dragging');
                    activeBullet = newBullet;
                    
                    // Update original slider value
                    originalSlider.value = newIndex;
                    
                    // Update display value
                    d3.select(valueLabelId).text(steps[newIndex].label);
                }
            }
        }
    };
    
    const handleMouseUp = (event) => {
        if (isDragging && activeBullet) {
            isDragging = false;
            activeBullet.classList.remove('dragging');
            
            // Reset any transform styling on all bullets
            customSliderContainer.querySelectorAll('.custom-slider-bullet').forEach(bullet => {
                if (bullet !== activeBullet) {
                    bullet.style.transform = 'translateX(-50%)';
                }
            });
            
            // Get the final index
            const finalIndex = parseInt(activeBullet.getAttribute('data-index'), 10);
            
            // Trigger change event on original slider
            originalSlider.value = finalIndex;
            originalSlider.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };
    
    // Add touch support for mobile devices
    const handleTouchStart = (event) => {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            handleMouseDown({
                target: document.elementFromPoint(touch.clientX, touch.clientY),
                clientX: touch.clientX,
                preventDefault: () => event.preventDefault()
            });
        }
    };
    
    const handleTouchMove = (event) => {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            handleMouseMove({
                clientX: touch.clientX,
                preventDefault: () => event.preventDefault()
            });
            
            // Prevent scrolling while dragging
            if (isDragging) {
                event.preventDefault();
            }
        }
    };
    
    const handleTouchEnd = (event) => {
        handleMouseUp(event);
    };
    
    // Function to clean up event listeners when slider is removed
    const cleanup = (event) => {
        if (event.detail && event.detail.sliderId === sliderId) {
            customSliderContainer.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            customSliderContainer.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('cleanupSlider', cleanup);
        }
    };
    
    // Add event listeners
    customSliderContainer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Add touch support
    customSliderContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    // Add cleanup listener
    document.addEventListener('cleanupSlider', cleanup);
    
    return customSliderContainer;
}

/**
 * Update zoom2 slider range based on the current zoom1 window size
 * Ensures zoom2 can only show a subset of what's visible in zoom1
 * Recreates the custom slider with updated bullet points
 */
export function updateZoom2SliderRange() {
    const plotConfig = window.appState.plotConfig; // Access plotConfig from global state

    const slider1 = d3.select("#zoom1-window");
    const slider2 = d3.select("#zoom2-window");
    const valueSpan2 = d3.select("#zoom2-window-val");
    const zoom2WindowContainer = slider2.node().parentNode;

    // Get current zoom1 window size and filter time steps
    const currentVal1_us = plotConfig.validTimeSteps[+slider1.property('value')].value_us;
    
    // Zoom2 can only show windows smaller than zoom1
    plotConfig.validZoom2Steps = plotConfig.validTimeSteps.filter(step => step.value_us < currentVal1_us);

    // Configure standard zoom2 window slider (which remains hidden)
    slider2
        .attr('min', 0)
        .attr('max', plotConfig.validZoom2Steps.length - 1)
        .attr('step', 1);

    // Calculate appropriate initial value
    let newIndex = +slider2.property('value');
    if (newIndex >= plotConfig.validZoom2Steps.length) {
        newIndex = Math.max(0, plotConfig.validZoom2Steps.length - 6);
        slider2.property('value', newIndex);
    }

    // Remove the old custom slider if it exists
    const oldCustomSlider = document.getElementById('zoom2-custom-container');
    if (oldCustomSlider) {
        // Clean up any global event listeners by triggering a custom cleanup event
        const cleanupEvent = new CustomEvent('cleanupSlider', { detail: { sliderId: 'zoom2' } });
        document.dispatchEvent(cleanupEvent);
        
        // Then remove the DOM element
        oldCustomSlider.remove();
    }

    // Create new custom slider if we have steps
    if (plotConfig.validZoom2Steps.length > 0) {
        createCustomSlider(
            zoom2WindowContainer,
            '#zoom2-window',
            '#zoom2-window-val',
            plotConfig.validZoom2Steps,
            newIndex,
            'zoom2'
        );
        
        // Update display value
        valueSpan2.text(plotConfig.validZoom2Steps[newIndex].label);
    } else {
        valueSpan2.text('');
    }
}