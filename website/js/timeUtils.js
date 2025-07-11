export const timeSteps = []; // Exported so other modules can access it if needed

export function generateTimeSteps() {
    if (timeSteps.length > 0) return;
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
                    timeSteps.push({
                        label: `${val} ${unit}`,
                        value_us: value_us
                    });
                    addedValues.add(value_us);
                }
            });
        }
    }
    timeSteps.sort((a, b) => a.value_us - b.value_us);
}

export function getZoomDomains(plotConfig) {
    const {total_time_us} = plotConfig;
    const zoom1Pos = +document.getElementById('zoom1-pos').value / 100;
    const zoom1_index = +document.getElementById('zoom1-window').value;
    const zoom1_window_us = plotConfig.validTimeSteps[zoom1_index].value_us;

    const zoom2Pos = +document.getElementById('zoom2-pos').value / 100;
    const zoom2_index = +document.getElementById('zoom2-window').value;
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

export function setupTimeSliders(total_time_us, validTimeSteps) {
    const slider1 = d3.select("#zoom1-window");
    const valueSpan1 = d3.select("#zoom1-window-val");

    // Ensure plotConfig is accessible and up-to-date
    window.appState.plotConfig.validTimeSteps = timeSteps.filter(step => step.value_us < total_time_us);

    slider1
        .attr('min', 0)
        .attr('max', window.appState.plotConfig.validTimeSteps.length - 1)
        .attr('step', 1)
        .property('value', Math.floor(window.appState.plotConfig.validTimeSteps.length / 2));

    valueSpan1.text(window.appState.plotConfig.validTimeSteps[slider1.property('value')].label);

    updateZoom2SliderRange();
}

export function updateZoom2SliderRange() {
    const slider1 = d3.select("#zoom1-window");
    const slider2 = d3.select("#zoom2-window");
    const valueSpan2 = d3.select("#zoom2-window-val");

    const currentVal1_us = window.appState.plotConfig.validTimeSteps[+slider1.property('value')].value_us;
    window.appState.plotConfig.validZoom2Steps = window.appState.plotConfig.validTimeSteps.filter(step => step.value_us < currentVal1_us);

    const currentVal2_idx = +slider2.property('value');

    slider2
        .attr('min', 0)
        .attr('max', window.appState.plotConfig.validZoom2Steps.length - 1)
        .attr('step', 1);

    let newIndex = currentVal2_idx;
    if (newIndex >= window.appState.plotConfig.validZoom2Steps.length) {
        newIndex = Math.max(0, window.appState.plotConfig.validZoom2Steps.length - 1);
        slider2.property('value', newIndex);
    }

    if (window.appState.plotConfig.validZoom2Steps.length > 0) {
        valueSpan2.text(window.appState.plotConfig.validZoom2Steps[newIndex].label);
    } else {
        valueSpan2.text('');
    }
}