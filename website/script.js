const {openGroup, openArray, slice, HTTPStore} = await import("https://cdn.skypack.dev/zarr");

let zarrGroup = null;
let rawStore = null;
let overviewStore = null;
let plotConfig = null;
let lastChunkCache = {key: null, data: null};
const timeSteps = [];

function generateTimeSteps() {
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

// --- Main Plotting Logic ---
async function plotData() {
    if (!rawStore || !zarrGroup || !overviewStore) return;

    lastChunkCache = {key: null, data: null};

    const channel = +document.getElementById('channel-select').value;
    const trc = +document.getElementById('trc-select').value;
    const segment = +document.getElementById('segment-select').value;

    d3.select("#overview-chart").selectAll("*").remove();
    d3.select("#zoom1-chart").selectAll("*").remove();
    d3.select("#zoom2-chart").selectAll("*").remove();
    document.querySelector('.controls').style.display = 'block';
    document.querySelector('.chart-container').style.display = 'block';
    document.getElementById('plot-another-btn-header').style.display = 'block';

    const margin = {top: 40, right: 40, bottom: 50, left: 60};
    const fullWidth = 900;
    const chartHeight = 300;
    const width = fullWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    const attrs = await zarrGroup.attrs.asObject();
    const horiz_interval = attrs.horiz_interval;
    const vertical_gains = attrs.vertical_gains;
    const vertical_offsets = attrs.vertical_offsets;
    const vertical_gain = vertical_gains[channel][trc];
    const vertical_offset = vertical_offsets[channel][trc];
    const no_of_samples = rawStore.shape[3];
    const adcToMv = (adc) => 1000 * (adc * vertical_gain - vertical_offset);
    const total_time_us = (no_of_samples - 1) * horiz_interval * 1e6;

    plotConfig = {
        margin, width, height, fullWidth, chartHeight,
        horiz_interval, no_of_samples, total_time_us,
        adcToMv,
        rawStore, overviewStore, channel, trc, segment
    };

    setupTimeSliders(total_time_us);

    const overviewLoadingText = d3.select("#overview-chart").append("svg").attr("viewBox", `0 0 ${fullWidth} ${chartHeight}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`).append("text").attr("class", "loading-text").attr("x", width / 2).attr("y", height / 2).text("Loading overview...");

    const overviewSlice = await overviewStore.get([channel, trc, segment, null, null]);
    const overviewMin = (await overviewSlice.get(0)).data;
    const overviewMax = (await overviewSlice.get(1)).data;
    const downsampling_factor = no_of_samples / overviewMin.length;

    const overviewData = Array.from(overviewMin).map((min_val, i) => {
        const time_us = (i + 0.5) * downsampling_factor * horiz_interval * 1e6;
        return {
            time_us,
            min_mv: adcToMv(min_val),
            max_mv: adcToMv(overviewMax[i])
        };
    });

    plotConfig.overviewData = overviewData;
    plotConfig.globalYMin = d3.min(overviewData, d => d.min_mv);
    plotConfig.globalYMax = d3.max(overviewData, d => d.max_mv);
    overviewLoadingText.remove();

    await updateAllCharts();
}

async function getRawDataSlice(ch, trc, seg, start, end) {
    const chunkSize = rawStore.meta.chunks[3];
    const startChunkIdx = Math.floor(start / chunkSize);
    const endChunkIdx = Math.floor((end - 1) / chunkSize);

    let finalData = new Int16Array(end - start);
    let finalDataOffset = 0;

    for (let i = startChunkIdx; i <= endChunkIdx; i++) {
        const cacheKey = `${ch}-${trc}-${seg}-${i}`;
        let chunkData;

        if (lastChunkCache.key === cacheKey) {
            chunkData = lastChunkCache.data;
        } else {
            const chunkStart = i * chunkSize;
            const chunkEnd = Math.min((i + 1) * chunkSize, rawStore.shape[3]);
            const fetchedSlice = await rawStore.get([ch, trc, seg, slice(chunkStart, chunkEnd)]);
            chunkData = fetchedSlice.data;
            lastChunkCache = {key: cacheKey, data: chunkData};
        }

        const reqStartInChunk = Math.max(0, start - i * chunkSize);
        const reqEndInChunk = Math.min(chunkSize, end - i * chunkSize);

        const sliced = chunkData.subarray(reqStartInChunk, reqEndInChunk);
        finalData.set(sliced, finalDataOffset);
        finalDataOffset += sliced.length;
    }
    return finalData;
}

function getZoomDomains() {
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

async function updateAllCharts() {
    if (!plotConfig) return;
    const {width, height, total_time_us, overviewData, globalYMin, globalYMax} = plotConfig;
    const {zoom1Domain} = getZoomDomains();

    // --- Draw Overview Chart (Chart 0) ---
    d3.select("#overview-chart").selectAll("*").remove();
    const x0 = d3.scaleLinear().domain([0, total_time_us]).range([0, width]);
    const y0 = d3.scaleLinear().domain([globalYMin, globalYMax]).range([height, 0]).nice();
    const svg0 = createChartSVG("#overview-chart", "Overview");
    drawArea(svg0, overviewData, x0, y0, d => d.time_us, d => d.min_mv, d => d.max_mv);
    drawAxes(svg0, x0, y0, "Time (µs)");
    const zoomRect1 = svg0.append("rect").attr("class", "zoom-rect-1");
    zoomRect1.attr("x", x0(zoom1Domain[0])).attr("width", x0(zoom1Domain[1]) - x0(zoom1Domain[0])).attr("y", 0).attr("height", height);
    addDragHandler(zoomRect1, x0, document.getElementById('zoom1-pos'), updateAllCharts);

    // --- Draw Zoom 1 Chart ---
    d3.select("#zoom1-chart").selectAll("*").remove();
    const svg1 = createChartSVG("#zoom1-chart", `Zoom 1: ${zoom1Domain[0].toFixed(1)}µs - ${zoom1Domain[1].toFixed(1)}µs`);
    await renderDetail(svg1, zoom1Domain, "Time (µs)");

    // --- Draw Zoom 2 Chart and UI ---
    await updateZoom2Chart();
}

async function updateZoom2Chart() {
    if (!plotConfig) return;
    const {width} = plotConfig;
    const {zoom1Domain, zoom2Domain} = getZoomDomains();

    // --- Draw Zoom 2 Chart ---
    d3.select("#zoom2-chart").selectAll("*").remove();
    const svg2 = createChartSVG("#zoom2-chart", `Zoom 2: ${zoom2Domain[0].toFixed(3)}µs - ${zoom2Domain[1].toFixed(3)}µs`);
    await renderDetail(svg2, zoom2Domain, "Time (µs)");

    // --- Update Zoom 2 Rectangle (on Chart 1) ---
    const x1 = d3.scaleLinear().domain(zoom1Domain).range([0, width]);
    const svg1 = d3.select("#zoom1-chart svg g");
    const zoomRect2 = svg1.selectAll(".zoom-rect-2").data([1]);

    zoomRect2.enter().append("rect").attr("class", "zoom-rect-2")
        .merge(zoomRect2)
        .attr("x", x1(zoom2Domain[0]))
        .attr("width", x1(zoom2Domain[1]) - x1(zoom2Domain[0]))
        .attr("y", 0).attr("height", plotConfig.height)
        .call(addDragHandler, x1, document.getElementById('zoom2-pos'), updateZoom2Chart);
}

function createChartSVG(selector, title) {
    const {margin, width, height, fullWidth, chartHeight} = plotConfig;
    const svg = d3.select(selector)
        .append("svg").attr("viewBox", `0 0 ${fullWidth} ${chartHeight}`)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("text").attr("x", width / 2).attr("y", -margin.top / 2).attr("text-anchor", "middle").style("font-size", "16px").style("font-weight", "600").text(title);
    svg.append("text").attr("transform", "rotate(-90)").attr("y", 0 - margin.left + 15).attr("x", 0 - (height / 2)).attr("dy", "1em").style("text-anchor", "middle").text("Voltage (mV)");
    return svg;
}

function drawAxes(svg, xScale, yScale, xLabel) {
    const {height, margin, width} = plotConfig;
    svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".3f")));
    svg.append("g").call(d3.axisLeft(yScale).ticks(5));
    svg.append("text").attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`).style("text-anchor", "middle").text(xLabel);
}

function drawArea(svg, data, xScale, yScale, xAcc, y0Acc, y1Acc) {
    svg.append("path").datum(data).attr("fill", "#ccc").attr("d", d3.area().x(d => xScale(xAcc(d))).y0(d => yScale(y0Acc(d))).y1(d => yScale(y1Acc(d))));
}

function drawLine(svg, data, xScale, yScale, xAcc, yAcc) {
    svg.append("path").datum(data).attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 1.5).attr("d", d3.line().x(d => xScale(xAcc(d))).y(d => yScale(yAcc(d))));
}

async function renderDetail(svg, domain_us, xLabel) {
    const {horiz_interval, no_of_samples, adcToMv, channel, trc, segment, width, height} = plotConfig;

    const loadingText = svg.append("text").attr("class", "loading-text").attr("x", width / 2).attr("y", height / 2).text("Loading detail...");

    const startIndex = Math.max(0, Math.floor(domain_us[0] / (horiz_interval * 1e6)));
    const endIndex = Math.min(no_of_samples, Math.ceil(domain_us[1] / (horiz_interval * 1e6)));
    const visibleSampleWidth = endIndex - startIndex;
    const detailThreshold = 40000;

    const xScale = d3.scaleLinear().domain(domain_us).range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);

    if (visibleSampleWidth > detailThreshold) {
        const target_points = 4000;
        const step = Math.max(1, Math.floor(visibleSampleWidth / target_points));
        const detailOverviewData = [];
        let yMin = Infinity, yMax = -Infinity;

        for (let i = startIndex; i < endIndex; i += step) {
            const chunkStart = i;
            const chunkEnd = Math.min(i + step, endIndex);
            const chunkData = await getRawDataSlice(channel, trc, segment, chunkStart, chunkEnd);
            let min_mv = Infinity, max_mv = -Infinity;
            for (const val of chunkData) {
                const mv = adcToMv(val);
                if (mv < min_mv) min_mv = mv;
                if (mv > max_mv) max_mv = mv;
            }
            if (min_mv < yMin) yMin = min_mv;
            if (max_mv > yMax) yMax = max_mv;
            const time_us = (chunkStart + (chunkEnd - chunkStart) / 2) * horiz_interval * 1e6;
            detailOverviewData.push({time_us, min_mv, max_mv});
        }
        loadingText.remove();
        yScale.domain([yMin, yMax]).nice();
        drawArea(svg, detailOverviewData, xScale, yScale, d => d.time_us, d => d.min_mv, d => d.max_mv);

    } else {
        const chunkData = await getRawDataSlice(channel, trc, segment, startIndex, endIndex);
        const detailData = Array.from(chunkData).map((v, i) => ({
            time_us: (startIndex + i) * horiz_interval * 1e6,
            voltage_mv: adcToMv(v)
        }));
        loadingText.remove();
        yScale.domain(d3.extent(detailData, d => d.voltage_mv) || [0, 0]).nice();
        drawLine(svg, detailData, xScale, yScale, d => d.time_us, d => d.voltage_mv);
    }
    drawAxes(svg, xScale, yScale, xLabel);
}

function addDragHandler(target, scale, slider, endCallback) {
    const drag = d3.drag()
        .on("start", function (event) {
            d3.select(this).raise();
        })
        .on("drag", function (event) {
            const [minRange, maxRange] = scale.range();
            const currentX = parseFloat(d3.select(this).attr("x"));
            const width = parseFloat(d3.select(this).attr("width"));
            let newX = currentX + event.dx;
            newX = Math.max(minRange, Math.min(newX, maxRange - width));
            d3.select(this).attr("x", newX);

            const centerPx = newX + width / 2;
            const centerVal = scale.invert(centerPx);
            const [domainStart, domainEnd] = scale.domain();
            const domainSpan = domainEnd - domainStart;

            const newPosPercent = ((centerVal - domainStart) / domainSpan) * 100;

            slider.value = Math.round(newPosPercent);
        })
        .on("end", endCallback);
    target.call(drag);
}

function setupTimeSliders(total_time_us) {
    const slider1 = d3.select("#zoom1-window");
    const valueSpan1 = d3.select("#zoom1-window-val");

    plotConfig.validTimeSteps = timeSteps.filter(step => step.value_us < total_time_us);

    slider1
        .attr('min', 0)
        .attr('max', plotConfig.validTimeSteps.length - 1)
        .attr('step', 1)
        .property('value', Math.floor(plotConfig.validTimeSteps.length / 2));

    valueSpan1.text(plotConfig.validTimeSteps[slider1.property('value')].label);

    updateZoom2SliderRange();
}

function updateZoom2SliderRange() {
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

function initialize() {
    generateTimeSteps();
    setupCopyLinkButton();
    const urlParams = new URLSearchParams(window.location.search);
    const dataUrl = urlParams.get('data');

    const loadData = async (url) => {
        document.getElementById('input-container').style.display = 'none';
        try {
            const store = new HTTPStore(url);
            zarrGroup = await openGroup(store);
            rawStore = await openArray({store, path: 'raw'});
            overviewStore = await openArray({store, path: 'overview/0'});
            populateSelectors(rawStore);
            showCopyLinkContainer(url);
        } catch (error) {
            const container = document.getElementById('selection-container');
            container.innerHTML = `<div style="color: red; text-align: center; padding: 2rem;"><h3>Error</h3><p>${error.message}</p></div>`;
            container.style.display = 'block';
        }
    };

    if (dataUrl) loadData(dataUrl);
    else document.getElementById('input-container').style.display = 'block';

    document.getElementById('load-button').addEventListener('click', () => {
        const dataUrlInput = document.getElementById('zarr-input').value;
        if (dataUrlInput) {
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('data', dataUrlInput);
            window.history.pushState({path: newUrl.href}, '', newUrl.href);
            loadData(dataUrlInput);
        }
    });

    document.getElementById('plot-button').addEventListener('click', plotData);

    document.getElementById('plot-another-btn-header').addEventListener('click', () => {
        window.location.href = 'https://datamedsci.github.io/ZoomingOnline';
    });

    // Position Sliders
    d3.select('#zoom1-pos').on('change', updateAllCharts);
    d3.select('#zoom2-pos').on('change', updateZoom2Chart);

    // Window Sliders
    d3.select('#zoom1-window').on('change', () => {
        updateZoom2SliderRange();
        updateAllCharts();
    });
    d3.select('#zoom2-window').on('change', updateZoom2Chart);

    d3.select('#zoom1-window').on('input', () => {
        const slider = d3.select('#zoom1-window');
        d3.select('#zoom1-window-val').text(plotConfig.validTimeSteps[+slider.property('value')].label);
    });
    d3.select('#zoom2-window').on('input', () => {
        const slider = d3.select('#zoom2-window');
        if (plotConfig.validZoom2Steps.length > 0) {
            d3.select('#zoom2-window-val').text(plotConfig.validZoom2Steps[+slider.property('value')].label);
        }
    });
    d3.select('#zoom1-pos').on('input', () => d3.select('#zoom1-pos-val').text(d3.select('#zoom1-pos').property('value') + '%'));
    d3.select('#zoom2-pos').on('input', () => d3.select('#zoom2-pos-val').text(d3.select('#zoom2-pos').property('value') + '%'));
}

function showCopyLinkContainer(dataUrl) {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('data', dataUrl);
    const linkToShow = currentUrl.toString();
    
    document.getElementById('copy-link-content').textContent = linkToShow;
    document.getElementById('copy-link-container').style.display = 'block';
}

function setupCopyLinkButton() {
    const copyButton = document.getElementById('copy-link-button');
    const copyIcon = copyButton.querySelector('.copy-icon');
    const checkIcon = copyButton.querySelector('.check-icon');
    const copyText = copyButton.querySelector('.copy-text');

    copyButton.addEventListener('click', async () => {
        const linkContent = document.getElementById('copy-link-content').textContent;
        
        try {
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

function populateSelectors(store) {
    const [channels, trcs, segments] = store.shape;
    const createOptions = (selectId, count, prefix) => {
        const select = d3.select(selectId);
        select.selectAll("option").remove();
        for (let i = 0; i < count; i++) {
            select.append("option").attr("value", i).text(`${prefix} ${i + 1}`);
        }
    };
    createOptions("#channel-select", channels, "Channel");
    createOptions("#trc-select", trcs, "TRC");
    createOptions("#segment-select", segments, "Segment");
    document.getElementById('selection-container').style.display = 'block';
}

initialize();