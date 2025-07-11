import { getRawDataSlice } from './dataLoader.js';
import { getZoomDomains } from './timeUtils.js';

let plotConfig = null; // This will hold the configuration for the current plot

// Export plotConfig so main.js can access it
export { plotConfig };

// --- Main Plotting Logic ---
export async function plotData(rawStore, zarrGroup, overviewStore, lastChunkCache, timeSteps) {
    // Update global appState with the latest stores and cache
    window.appState.rawStore = rawStore;
    window.appState.zarrGroup = zarrGroup;
    window.appState.overviewStore = overviewStore;
    window.appState.lastChunkCache = lastChunkCache; // Reset cache just in case

    d3.select("#overview-chart").selectAll("*").remove();
    d3.select("#zoom1-chart").selectAll("*").remove();
    d3.select("#zoom2-chart").selectAll("*").remove();
    document.querySelector('.controls').style.display = 'block';
    document.querySelector('.chart-container').style.display = 'block';
    document.getElementById('plot-another-btn-header').style.display = 'block';

    const channel = +document.getElementById('channel-select').value;
    const trc = +document.getElementById('trc-select').value;
    const segment = +document.getElementById('segment-select').value;

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

    plotConfig = { // This is where plotConfig is set for the current plot
        margin, width, height, fullWidth, chartHeight,
        horiz_interval, no_of_samples, total_time_us,
        adcToMv,
        channel, trc, segment,
        // These will be populated by setupTimeSliders in main.js
        validTimeSteps: [],
        validZoom2Steps: []
    };
    window.appState.plotConfig = plotConfig; // Update global app state

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


export async function updateAllCharts() {
    if (!plotConfig) return; // Ensure plotConfig is initialized
    const {width, height, total_time_us, overviewData, globalYMin, globalYMax} = plotConfig;
    const {zoom1Domain} = getZoomDomains(plotConfig);

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

export async function updateZoom2Chart() {
    if (!plotConfig) return;
    const {width} = plotConfig;
    const {zoom1Domain, zoom2Domain} = getZoomDomains(plotConfig);

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