// timeSteps will now be part of window.appState
// export const timeSteps = []; // No longer directly exported, accessed via window.appState.timeSteps

export function generateTimeSteps() {
    // Populate window.appState.timeSteps directly
    if (window.appState.timeSteps.length > 0) return;
    const units = {'ms': 1e3, 'ns': 1e-3, 'µs': 1,};
    const bases = [1, 2, 5];
    const addedValues = new Set();

    for (const unit in units) {
        for (let mag = 1; mag <= 1000; mag *= 10) {
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
    window.appState.timeSteps.sort((a, b) => a.value_us - b.value_us);
}

export function getZoomDomains() {
    const plotConfig = window.appState.plotConfig; // Access plotConfig from global state
    if (!plotConfig) {
        console.error("getZoomDomains: plotConfig is not defined.");
        // Return a default or throw an error, depending on desired behavior
        return { zoom1Domain: [0, 1], zoom2Domain: [0, 1] };
    }

    const {total_time_us} = plotConfig;
    const zoom1Pos = +document.getElementById('zoom1-pos').value / 100;
    const zoom1_index = +document.getElementById('zoom1-window').value;
    // CRITICAL FIX: Ensure validTimeSteps is populated before access
    const zoom1_window_us = plotConfig.validTimeSteps[zoom1_index].value_us;

    const zoom2Pos = +document.getElementById('zoom2-pos').value / 100;
    const zoom2_index = +document.getElementById('zoom2-window').value;
    // CRITICAL FIX: Ensure validZoom2Steps is populated before access
    const zoom2_window_us = plotConfig.validZoom2Steps[zoom2_index].value_us;

    const zoom1HalfWidth_us = zoom1_window_us / 2;
    const zoom1Center_us = total_time_us * zoom1Pos;
    const zoom1Domain = [
        Math.max(0, zoom1Center_us - zoom1HalfWidth_us),
        Math.min(total_time_us, zoom1Center_us + zoom1HalfWidth_us)
    ];

    const zoom2Range_us = (zoom1Domain[1] - zoom1Domain[0]);
    const zoom2HalfWidth_us = zoom2_window_us / 2;
    const zoom2Center_us = zoom1Domain[0] + (zoom2Range_us * zoom2Pos);
    const zoom2Domain = [
        Math.max(zoom1Domain[0], zoom2Center_us - zoom2HalfWidth_us),
        Math.min(zoom1Domain[1], zoom2Center_us + zoom2HalfWidth_us)
    ];

    return {zoom1Domain, zoom2Domain};
}

export function setupTimeSliders() {
    const plotConfig = window.appState.plotConfig; // Access plotConfig from global state
    const total_time_us = plotConfig.total_time_us; // Get total_time_us from plotConfig

    const slider1 = d3.select("#zoom1-window");
    const valueSpan1 = d3.select("#zoom1-window-val");

    // Populate plotConfig.validTimeSteps using the globally available timeSteps
    window.appState.plotConfig.validTimeSteps = window.appState.timeSteps.filter(step => step.value_us < total_time_us);

    slider1
        .attr('min', 0)
        .attr('max', window.appState.plotConfig.validTimeSteps.length - 1)
        .attr('step', 1)
        .property('value', Math.floor(window.appState.plotConfig.validTimeSteps.length / 2));

    valueSpan1.text(window.appState.plotConfig.validTimeSteps[slider1.property('value')].label);

    updateZoom2SliderRange();
}

export function updateZoom2SliderRange() {
    const plotConfig = window.appState.plotConfig; // Access plotConfig from global state

    const slider1 = d3.select("#zoom1-window");
    const slider2 = d3.select("#zoom2-window");
    const valueSpan2 = d3.select("#zoom2-window-val");

    const currentVal1_us = plotConfig.validTimeSteps[+slider1.property('value')].value_us;
    plotConfig.validZoom2Steps = plotConfig.validTimeSteps.filter(step => step.value_us < currentVal1_us);

    const currentVal2_idx = +slider2.property('value');

    slider2
        .attr('min', 0)
        .attr('max', plotConfig.validZoom2Steps.length - 1)
        .attr('step', 1);

    let newIndex = currentVal2_idx;
    if (newIndex >= plotConfig.validZoom2Steps.length) {
        newIndex = Math.max(0, plotConfig.validZoom2Steps.length - 1);
        slider2.property('value', newIndex);
    }

    if (plotConfig.validZoom2Steps.length > 0) {
        valueSpan2.text(plotConfig.validZoom2Steps[newIndex].label);
    } else {
        valueSpan2.text('');
    }
}