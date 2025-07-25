import { getRawDataSlice } from './dataLoader.js';
import { getZoomDomains } from './timeUtils.js';
import * as zarr from "https://esm.sh/zarrita";

/**
 * chartRenderer.js
 * 
 * Main Plotting Logic
 * This module handles chart creation, data rendering, and interactive visualizations
 * for time series data stored in Zarr format. It implements a three-level zoom system:
 * - Overview chart: Shows the entire dataset with min/max values
 * - Zoom1 chart: Shows a user-selected region of the overview at higher detail
 * - Zoom2 chart: Shows a user-selected region of the zoom1 chart at highest detail
 * 
 * The module includes interactive zoom rectangles that can be dragged to reposition
 * the view at each zoom level, synchronized with position sliders in the UI.
 */

// Time conversion factors
const S_TO_US_FACTOR = 1e6;
const S_TO_NS_FACTOR = 1e9;
const US_TO_NS_FACTOR = 1000;

// Threshold for switching to nanosecond display (in microseconds)
const NANOSECOND_THRESHOLD_US = 0.5;

// Detail view threshold for decimation
const DETAIL_THRESHOLD = 40000;

/**
 * Helper function to determine appropriate time unit and label
 * @param {number} timeSpanUs - Time span in microseconds
 * @returns {Object} Object containing useNanoseconds flag and appropriate label
 */
function getTimeUnitInfo(timeSpanUs) {
    const useNanoseconds = timeSpanUs <= NANOSECOND_THRESHOLD_US;
    const timeUnitLabel = useNanoseconds ? "Relative Time [ns]" : "Relative Time [µs]";
    return { useNanoseconds, timeUnitLabel };
}

/**
 * Helper function to format time duration with appropriate units
 * @param {number} durationUs - Duration in microseconds
 * @param {boolean} useNanoseconds - Whether to use nanoseconds
 * @returns {string} Formatted duration string with units
 */
function formatTimeDuration(durationUs, useNanoseconds) {
    if (useNanoseconds) {
        const durationNs = durationUs * US_TO_NS_FACTOR;
        return `${durationNs.toFixed(0)}ns`;
    } else {
        return `${durationUs.toFixed(0)}µs`;
    }
}

/**
 * Initialize and plot the data across all chart levels
 * @param {Object} rawStore - The raw data array containing the full dataset
 * @param {Object} zarrGroup - The Zarr group containing metadata and attributes
 * @param {Object} overviewStore - The downsampled data for overview plotting
 * @param {Object} lastChunkCache - Cache for optimizing data access
 */
export async function plotData(rawStore, zarrGroup, overviewStore, lastChunkCache) {
    // Update global appState with the latest stores and cache
    window.appState.rawStore = rawStore;
    window.appState.rawArray = rawStore;       // For zarrita.js
    window.appState.zarrGroup = zarrGroup;
    window.appState.overviewStore = overviewStore;
    window.appState.overviewArray = overviewStore; // For zarrita.js
    window.appState.lastChunkCache = lastChunkCache; // Reset cache just in case

    // Clear existing charts
    d3.select("#overview-chart").selectAll("*").remove();
    d3.select("#zoom1-chart").selectAll("*").remove();
    d3.select("#zoom2-chart").selectAll("*").remove();
    
    // Show UI controls now that we have data
    document.querySelector('.controls').style.display = 'block';
    document.querySelector('.chart-container').style.display = 'block';
    document.getElementById('plot-another-btn-header').style.display = 'block';

    // Get current user selections
    const channel = +document.getElementById('channel-select').value;
    const trc = +document.getElementById('trc-select').value;
    const segment = +document.getElementById('segment-select').value;

    // Define chart dimensions and layout
    const margin = {top: 40, right: 40, bottom: 50, left: 60};
    const fullWidth = 900;
    const chartHeight = 300;
    const width = fullWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    // Extract metadata from Zarr attributes - zarrita.js accesses attributes differently
    const attrs = zarrGroup.attrs;
    const horiz_interval = attrs.horiz_interval;
    const vertical_gains = attrs.vertical_gains;
    const vertical_offsets = attrs.vertical_offsets;
    const vertical_gain = vertical_gains[channel][trc];
    const vertical_offset = vertical_offsets[channel][trc];
    const no_of_samples = rawStore.shape[3];
    
    // Function to convert ADC values to millivolts
    const adcToMilliVolts = (adc) => 1000 * (adc * vertical_gain - vertical_offset);
    const total_time_us = (no_of_samples - 1) * horiz_interval * S_TO_US_FACTOR;

    // Initialize plotConfig within the global appState
    window.appState.plotConfig = {
        margin, width, height, fullWidth, chartHeight,
        horiz_interval, no_of_samples, total_time_us,
        adcToMv: adcToMilliVolts,
        channel, trc, segment,
        // These will be populated by setupTimeSliders in timeUtils.js
        validTimeSteps: [],
        validZoom2Steps: []
    };

    // Show loading indicator for overview chart
    const overviewLoadingText = d3.select("#overview-chart").append("svg").attr("viewBox", `0 0 ${fullWidth} ${chartHeight}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`).append("text").attr("class", "loading-text").attr("x", width / 2).attr("y", height / 2).text("Loading overview...");

    // Load overview (downsampled) data using zarrita.js
    // The overview array has shape [channel, trc, segment, min_max(2), time_points]
    // We need to get the full slice for the selected channel, trc, segment
    const overviewMinMax = await zarr.get(overviewStore, [channel, trc, segment]);
    
    // The data structure is [2, numPoints] where first row is mins, second is maxs
    const overviewMinValues = [];
    const overviewMaxValues = [];
    
    // Extract min and max values from the zarrita.js data structure
    const numPoints = overviewMinMax.shape[1]; // Number of time points
    for (let i = 0; i < numPoints; i++) {
        overviewMinValues.push(overviewMinMax.data[i]); // Min values in first row
        overviewMaxValues.push(overviewMinMax.data[numPoints + i]); // Max values in second row
    }
    
    const downsampling_factor = no_of_samples / overviewMinValues.length;

    // Process overview data for plotting
    const processedOverviewData = [];
    for (let i = 0; i < overviewMinValues.length; i++) {
        const time_us = (i + 0.5) * downsampling_factor * horiz_interval * S_TO_US_FACTOR;
        processedOverviewData.push({
            time_us,
            min_mv: adcToMilliVolts(overviewMinValues[i]),
            max_mv: adcToMilliVolts(overviewMaxValues[i])
        });
    }

    // Store processed data and calculate global Y-axis limits
    window.appState.plotConfig.overviewData = processedOverviewData;
    window.appState.plotConfig.globalYMin = d3.min(processedOverviewData, d => d.min_mv);
    window.appState.plotConfig.globalYMax = d3.max(processedOverviewData, d => d.max_mv);
    overviewLoadingText.remove();

    // Do NOT call updateAllCharts here. It will be called from main.js after setupTimeSliders.
}

/**
 * Update all three charts (overview, zoom1, zoom2) based on current state
 * Called when user changes position or zoom level
 */
export async function updateAllCharts() {
    const plotConfig = window.appState.plotConfig;
    if (!plotConfig) return;
    const {width, height, total_time_us, overviewData, globalYMin, globalYMax} = plotConfig;
    const {zoom1Domain} = getZoomDomains(); // getZoomDomains now takes no arguments, accesses appState directly

    // --- Draw Overview Chart (Chart 0) ---
    d3.select("#overview-chart").selectAll("*").remove();
    const x0 = d3.scaleLinear().domain([0, total_time_us]).range([0, width]);
    const y0 = d3.scaleLinear().domain([globalYMin, globalYMax]).range([height, 0]).nice();
    const svg0 = createChartSVG("#overview-chart", "Overview");
    drawArea(svg0, overviewData, x0, y0, d => d.time_us, d => d.min_mv, d => d.max_mv);
    drawAxes(svg0, x0, y0, "Time [µs]");
    drawGridLines(svg0, x0, y0);
    
    // Add draggable zoom rectangle to overview chart
    const zoomRect1 = svg0.append("rect")
        .attr("class", "zoom-rect-1")
        .attr("x", x0(zoom1Domain[0]))
        .attr("width", x0(zoom1Domain[1]) - x0(zoom1Domain[0]))
        .attr("y", 0)
        .attr("height", height);
    
    // Remove any existing drag behavior before reapplying to avoid duplicate handlers
    zoomRect1.on('.drag', null);
        
    // Apply drag behavior to the zoom1 rectangle
    addDragHandler(zoomRect1, x0, document.getElementById('zoom1-pos'), updateAllCharts);

    // --- Draw Zoom 1 Chart ---
    d3.select("#zoom1-chart").selectAll("*").remove();
    
    // Calculate the duration of the zoomed region for better context
    const zoom1Duration = zoom1Domain[1] - zoom1Domain[0];
    
    // Get time unit info based on zoom level
    const { useNanoseconds, timeUnitLabel } = getTimeUnitInfo(zoom1Duration);
    
    // Format title with appropriate unit
    const zoom1Title = `Zoom 1: ${formatTimeDuration(zoom1Duration, useNanoseconds)} window`;
    
    const svg1 = createChartSVG("#zoom1-chart", zoom1Title);
    await renderDetail(svg1, zoom1Domain, timeUnitLabel);

    // --- Draw Zoom 2 Chart and UI ---
    await updateZoom2Chart();
}

/**
 * Update only the Zoom 2 chart (highest detail level)
 * Called when user adjusts zoom2 position or window size
 */
export async function updateZoom2Chart() {
    const plotConfig = window.appState.plotConfig;
    if (!plotConfig) return;
    const {width} = plotConfig;
    const {zoom1Domain, zoom2Domain} = getZoomDomains(); // getZoomDomains now takes no arguments, accesses appState directly

    // --- Draw Zoom 2 Chart ---
    d3.select("#zoom2-chart").selectAll("*").remove();
    
    // Calculate the duration of the zoomed region for better context
    const zoom2Duration = zoom2Domain[1] - zoom2Domain[0];
    
    // Get time unit info based on zoom level
    const { useNanoseconds, timeUnitLabel } = getTimeUnitInfo(zoom2Duration);
    
    // Format title with appropriate unit
    const zoom2Title = `Zoom 2: ${formatTimeDuration(zoom2Duration, useNanoseconds)} window`;
    
    const svg2 = createChartSVG("#zoom2-chart", zoom2Title);
    await renderDetail(svg2, zoom2Domain, timeUnitLabel);

    // --- Update Zoom 2 Rectangle (on Chart 1) ---
    const x1 = d3.scaleLinear().domain(zoom1Domain).range([0, width]);
    const svg1 = d3.select("#zoom1-chart svg g");
    const zoomRect2 = svg1.selectAll(".zoom-rect-2").data([1]);

    // Create or update the zoom2 rectangle
    const mergedRect = zoomRect2.enter().append("rect")
        .attr("class", "zoom-rect-2")
        .merge(zoomRect2)
        .attr("x", x1(zoom2Domain[0]))
        .attr("width", x1(zoom2Domain[1]) - x1(zoom2Domain[0]))
        .attr("y", 0)
        .attr("height", plotConfig.height);
        
    // Remove any existing drag behavior before reapplying to avoid duplicate handlers
    mergedRect.on('.drag', null);
    
    // Apply drag behavior to the zoom2 rectangle
    addDragHandler(mergedRect, x1, document.getElementById('zoom2-pos'), updateZoom2Chart);
}

/**
 * Create SVG container for a chart with title and y-axis label
 * @param {string} selector - CSS selector for the chart container
 * @param {string} title - Chart title
 * @returns {Object} - D3 selection of the SVG group for drawing
 */
function createChartSVG(selector, title) {
    const plotConfig = window.appState.plotConfig;
    const {margin, width, height, fullWidth, chartHeight} = plotConfig;
    const svg = d3.select(selector)
        .append("svg").attr("viewBox", `0 0 ${fullWidth} ${chartHeight}`)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("text").attr("x", width / 2).attr("y", -margin.top / 2).attr("text-anchor", "middle").style("font-size", "16px").style("font-weight", "600").text(title);
    svg.append("text").attr("transform", "rotate(-90)").attr("y", 0 - margin.left + 15).attr("x", 0 - (height / 2)).attr("dy", "1em").style("text-anchor", "middle").text("Voltage [mV]");
    return svg;
}

/**
 * Draw x and y axes on the chart
 * @param {Object} svg - D3 selection of the SVG group
 * @param {Function} xScale - D3 scale function for x-axis
 * @param {Function} yScale - D3 scale function for y-axis
 * @param {string} xLabel - Label for x-axis
 */
function drawAxes(svg, xScale, yScale, xLabel) {
    const plotConfig = window.appState.plotConfig;
    const {height, margin, width} = plotConfig;
    svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".3f")));
    svg.append("g").call(d3.axisLeft(yScale).ticks(5));
    svg.append("text").attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`).style("text-anchor", "middle").text(xLabel);
}

/**
 * Draw grid lines on the chart
 * @param {Object} svg - D3 selection of the SVG group
 * @param {Function} xScale - D3 scale function for x-axis
 * @param {Function} yScale - D3 scale function for y-axis
 */
function drawGridLines(svg, xScale, yScale) {
    const plotConfig = window.appState.plotConfig;
    const { height, width } = plotConfig;
    
    // Add horizontal grid lines
    svg.append("g")
        .attr("class", "grid-lines")
        .selectAll("line.horizontal-grid")
        .data(yScale.ticks(5))
        .enter()
        .append("line")
        .attr("class", "horizontal-grid")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.2);

    // Add vertical grid lines
    svg.append("g")
        .attr("class", "grid-lines")
        .selectAll("line.vertical-grid")
        .data(xScale.ticks(5))
        .enter()
        .append("line")
        .attr("class", "vertical-grid")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.2);
}

/**
 * Draw a filled area chart (used for min-max overview)
 * @param {Object} svg - D3 selection of the SVG group
 * @param {Array} data - Array of data points
 * @param {Function} xScale - D3 scale function for x-axis
 * @param {Function} yScale - D3 scale function for y-axis
 * @param {Function} xAcc - Accessor function for x values
 * @param {Function} y0Acc - Accessor function for bottom y values
 * @param {Function} y1Acc - Accessor function for top y values
 */
function drawArea(svg, data, xScale, yScale, xAcc, y0Acc, y1Acc) {
    svg.append("path").datum(data).attr("fill", "#000").attr("d", d3.area().x(d => xScale(xAcc(d))).y0(d => yScale(y0Acc(d))).y1(d => yScale(y1Acc(d))));
}

/**
 * Draw a line chart
 * @param {Object} svg - D3 selection of the SVG group
 * @param {Array} data - Array of data points
 * @param {Function} xScale - D3 scale function for x-axis
 * @param {Function} yScale - D3 scale function for y-axis
 * @param {Function} xAcc - Accessor function for x values
 * @param {Function} yAcc - Accessor function for y values
 */
function drawLine(svg, data, xScale, yScale, xAcc, yAcc) {
    svg.append("path").datum(data).attr("fill", "none").attr("stroke", "black").attr("stroke-width", 1.5).attr("d", d3.line().x(d => xScale(xAcc(d))).y(d => yScale(yAcc(d))));
}

/**
 * Render detailed data for zoom charts with adaptive resolution
 * @param {Object} svg - D3 selection of the SVG group
 * @param {Array} domain_us - Time domain [start, end] in microseconds
 * @param {string} xLabel - Label for x-axis
 */
async function renderDetail(svg, domain_us, xLabel) {
    const plotConfig = window.appState.plotConfig;
    const {horiz_interval, no_of_samples, adcToMv, channel, trc, segment, width, height} = plotConfig;

    const loadingText = svg.append("text").attr("class", "loading-text").attr("x", width / 2).attr("y", height / 2).text("Loading detail...");

    // Calculate data indices for the visible region
    const startIndex = Math.max(0, Math.floor(domain_us[0] / (horiz_interval * S_TO_US_FACTOR)));
    const endIndex = Math.min(no_of_samples, Math.ceil(domain_us[1] / (horiz_interval * S_TO_US_FACTOR)));
    const visibleSampleWidth = endIndex - startIndex;
    
    // Calculate time span in microseconds
    const timeSpanUs = domain_us[1] - domain_us[0];
    
    // Determine if we should use nanoseconds (for zoom levels of 500ns or less)
    const { useNanoseconds } = getTimeUnitInfo(timeSpanUs);
    
    // Calculate relative time range starting from first visible sample
    const relativeStartTime = 0;
    const timeFactor = useNanoseconds ? S_TO_NS_FACTOR : S_TO_US_FACTOR;
    const relativeEndTime = (endIndex - startIndex) * horiz_interval * timeFactor;
    const relativeTimeRange = [relativeStartTime, relativeEndTime];

    // Use relative time domain for x-axis
    const xScale = d3.scaleLinear().domain(relativeTimeRange).range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);

    // For large data ranges, use decimation to improve performance
    if (visibleSampleWidth > DETAIL_THRESHOLD) {
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
            // Calculate time relative to first visible sample (in μs or ns)
            const relative_time = (chunkStart - startIndex + (chunkEnd - chunkStart) / 2) * horiz_interval * timeFactor;
            detailOverviewData.push({time_us: relative_time, min_mv, max_mv});
        }
        loadingText.remove();
        yScale.domain([yMin, yMax]).nice();
        drawGridLines(svg, xScale, yScale);
        drawArea(svg, detailOverviewData, xScale, yScale, d => d.time_us, d => d.min_mv, d => d.max_mv);

    } else {
        // For smaller ranges, show all data points without decimation
        const chunkData = await getRawDataSlice(channel, trc, segment, startIndex, endIndex);
        const detailData = Array.from(chunkData).map((v, i) => ({
            // Calculate time relative to first visible sample (in μs or ns)
            time_us: i * horiz_interval * timeFactor,
            voltage_mv: adcToMv(v)
        }));
        loadingText.remove();
        yScale.domain(d3.extent(detailData, d => d.voltage_mv) || [0, 0]).nice();
        drawGridLines(svg, xScale, yScale);
        drawLine(svg, detailData, xScale, yScale, d => d.time_us, d => d.voltage_mv);
    }
    
    // Update the X-axis label with appropriate time unit
    drawAxes(svg, xScale, yScale, xLabel);
}

/**
 * Add drag behavior to zoom rectangles
 * This function makes the zoom rectangle draggable and synchronizes its position
 * with the corresponding position slider. As the rectangle is dragged, the slider
 * updates, and vice versa. When dragging stops, the charts are redrawn.
 * 
 * @param {Object} target - D3 selection of the rectangle to make draggable
 * @param {Function} scale - D3 scale function for mapping data to pixel coordinates
 * @param {HTMLElement} slider - DOM element for the position slider to update
 * @param {Function} endCallback - Function to call when drag ends
 */
function addDragHandler(target, scale, slider, endCallback) {
    const plotConfig = window.appState.plotConfig;
    const width = plotConfig.width;
    let startX;
    let rectX;
    let rectWidth;
    
    const drag = d3.drag()
        .on("start", function (event) {
            // Store initial position and dimensions for reference during drag
            startX = event.x;
            rectX = parseFloat(target.attr("x"));
            rectWidth = parseFloat(target.attr("width"));
            
            // Add 'dragging' class for visual feedback
            target.classed("dragging", true);
        })
        .on("drag", function (event) {
            // Calculate new position with bounds checking
            const dx = event.x - startX;
            let newX = rectX + dx;
            
            // Constrain to chart boundaries to prevent dragging outside
            newX = Math.max(0, Math.min(width - rectWidth, newX));
            
            // Update rectangle position in the chart
            target.attr("x", newX);
            
            // Convert to percentage for slider (0-100%)
            // Using center point of rectangle for better UX
            const centerX = newX + (rectWidth / 2);
            const percentage = Math.round((centerX / width) * 100);
            
            // Update slider position value
            slider.value = percentage;
            
            // Update display text associated with the slider
            const sliderId = slider.id;
            d3.select(`#${sliderId}-val`).text(`${percentage}%`);
            
            // Trigger 'input' event on slider to update UI immediately
            // This ensures that the slider visually reflects the rectangle position
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        })
        .on("end", function(event) {
            // Remove dragging class when drag completes
            target.classed("dragging", false);
            
            // Trigger 'change' event on slider to apply the position change
            // This is important to trigger any event listeners on the slider
            slider.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Call the provided callback function to update all dependent charts
            // This ensures that zoom levels and visualizations stay synchronized
            if (endCallback) endCallback();
        });
        
    target.call(drag);
}