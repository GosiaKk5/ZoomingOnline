/**
 * chartRenderer.js
 * 
 * Chart rendering utility adapted for Svelte store-based state management.
 * Handles D3.js visualization of time series data with multi-level zoom functionality.
 */

import * as d3 from 'd3';
import { getRawDataSlice } from './dataLoader.js';
import { getZoomDomains } from './timeUtils.js';
import { get } from 'svelte/store';

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
 */
function getTimeUnitInfo(timeSpanUs) {
    const useNanoseconds = timeSpanUs <= NANOSECOND_THRESHOLD_US;
    const timeUnitLabel = useNanoseconds ? "Relative Time [ns]" : "Relative Time [µs]";
    return { useNanoseconds, timeUnitLabel };
}

/**
 * Helper function to format time duration with appropriate units
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
 * Initialize plot configuration and process overview data
 */
export async function initializePlotData(rawStore, zarrGroup, overviewStore, channel, trc, segment) {
    // Extract metadata from Zarr attributes
    const attrs = await zarrGroup.attrs.asObject();
    const horiz_interval = attrs.horiz_interval;
    const vertical_gains = attrs.vertical_gains;
    const vertical_offsets = attrs.vertical_offsets;
    const vertical_gain = vertical_gains[channel][trc];
    const vertical_offset = vertical_offsets[channel][trc];
    const no_of_samples = rawStore.shape[3];
    
    // Function to convert ADC values to millivolts
    const adcToMilliVolts = (adc) => 1000 * (adc * vertical_gain - vertical_offset);
    const total_time_us = (no_of_samples - 1) * horiz_interval * S_TO_US_FACTOR;

    // Chart dimensions
    const margin = {top: 40, right: 40, bottom: 50, left: 60};
    const fullWidth = 900;
    const chartHeight = 300;
    const width = fullWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    // Load overview (downsampled) data
    const overviewSlice = await overviewStore.get([channel, trc, segment, null, null]);
    const overviewMin = (await overviewSlice.get(0)).data;
    const overviewMax = (await overviewSlice.get(1)).data;
    const downsampling_factor = no_of_samples / overviewMin.length;

    // Process overview data for plotting
    const overviewData = Array.from(overviewMin).map((min_val, i) => {
        const time_us = (i + 0.5) * downsampling_factor * horiz_interval * S_TO_US_FACTOR;
        return {
            time_us,
            min_mv: adcToMilliVolts(min_val),
            max_mv: adcToMilliVolts(overviewMax[i])
        };
    });

    // Calculate global Y-axis limits
    const globalYMin = d3.min(overviewData, d => d.min_mv);
    const globalYMax = d3.max(overviewData, d => d.max_mv);

    return {
        margin, width, height, fullWidth, chartHeight,
        horiz_interval, no_of_samples, total_time_us,
        adcToMv: adcToMilliVolts,
        channel, trc, segment,
        overviewData, globalYMin, globalYMax,
        validTimeSteps: [],
        validZoom2Steps: []
    };
}

/**
 * Create SVG container for a chart with title and y-axis label
 */
export function createChartSVG(containerElement, title, margin, width, height, fullWidth, chartHeight) {
    // Clear existing content
    d3.select(containerElement).selectAll("*").remove();
    
    const svg = d3.select(containerElement)
        .append("svg")
        .attr("viewBox", `0 0 ${fullWidth} ${chartHeight}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .text(title);

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 15)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Voltage [mV]");

    return svg;
}

/**
 * Draw x and y axes on the chart
 */
export function drawAxes(svg, xScale, yScale, xLabel, height, margin, width) {
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".3f")));
    
    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(5));
    
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text(xLabel);
}

/**
 * Draw grid lines on the chart
 */
export function drawGridLines(svg, xScale, yScale, width, height) {
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
 */
export function drawArea(svg, data, xScale, yScale, xAcc, y0Acc, y1Acc) {
    svg.append("path")
        .datum(data)
        .attr("fill", "#000")
        .attr("d", d3.area()
            .x(d => xScale(xAcc(d)))
            .y0(d => yScale(y0Acc(d)))
            .y1(d => yScale(y1Acc(d)))
        );
}

/**
 * Draw a line chart
 */
export function drawLine(svg, data, xScale, yScale, xAcc, yAcc) {
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => xScale(xAcc(d)))
            .y(d => yScale(yAcc(d)))
        );
}

/**
 * Add draggable zoom rectangle with position callback
 */
export function addDragHandler(target, scale, width, onPositionChange) {
    let startX, rectX, rectWidth;
    
    const drag = d3.drag()
        .on("start", function (event) {
            startX = event.x;
            rectX = parseFloat(target.attr("x"));
            rectWidth = parseFloat(target.attr("width"));
            target.classed("dragging", true);
        })
        .on("drag", function (event) {
            const dx = event.x - startX;
            let newX = rectX + dx;
            
            // Constrain to chart boundaries
            newX = Math.max(0, Math.min(width - rectWidth, newX));
            target.attr("x", newX);
            
            // Convert to percentage for callback
            const centerX = newX + (rectWidth / 2);
            const percentage = Math.round((centerX / width) * 100);
            
            if (onPositionChange) {
                onPositionChange(percentage);
            }
        })
        .on("end", function(event) {
            target.classed("dragging", false);
        });
        
    target.call(drag);
}

/**
 * Render detailed data for zoom charts
 */
export async function renderDetailChart(
    containerElement, 
    domain_us, 
    plotConfig, 
    rawStoreObj, 
    cacheObj,
    title
) {
    const { horiz_interval, no_of_samples, adcToMv, channel, trc, segment, 
            width, height, margin, fullWidth, chartHeight } = plotConfig;

    // Calculate time span and determine units
    const timeSpanUs = domain_us[1] - domain_us[0];
    const { useNanoseconds, timeUnitLabel } = getTimeUnitInfo(timeSpanUs);

    // Create SVG
    const svg = createChartSVG(containerElement, title, margin, width, height, fullWidth, chartHeight);
    
    // Show loading text
    const loadingText = svg.append("text")
        .attr("class", "loading-text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .text("Loading detail...");

    // Calculate data indices for the visible region
    const startIndex = Math.max(0, Math.floor(domain_us[0] / (horiz_interval * S_TO_US_FACTOR)));
    const endIndex = Math.min(no_of_samples, Math.ceil(domain_us[1] / (horiz_interval * S_TO_US_FACTOR)));
    const visibleSampleWidth = endIndex - startIndex;
    
    // Calculate relative time range
    const relativeStartTime = 0;
    const timeFactor = useNanoseconds ? S_TO_NS_FACTOR : S_TO_US_FACTOR;
    const relativeEndTime = (endIndex - startIndex) * horiz_interval * timeFactor;
    const relativeTimeRange = [relativeStartTime, relativeEndTime];

    // Create scales
    const xScale = d3.scaleLinear().domain(relativeTimeRange).range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);

    try {
        // For large data ranges, use decimation
        if (visibleSampleWidth > DETAIL_THRESHOLD) {
            const target_points = 4000;
            const step = Math.max(1, Math.floor(visibleSampleWidth / target_points));
            const detailOverviewData = [];
            let yMin = Infinity, yMax = -Infinity;

            for (let i = startIndex; i < endIndex; i += step) {
                const chunkStart = i;
                const chunkEnd = Math.min(i + step, endIndex);
                const chunkData = await getRawDataSlice(rawStoreObj, cacheObj, channel, trc, segment, chunkStart, chunkEnd);
                
                let min_mv = Infinity, max_mv = -Infinity;
                for (const val of chunkData) {
                    const mv = adcToMv(val);
                    if (mv < min_mv) min_mv = mv;
                    if (mv > max_mv) max_mv = mv;
                }
                if (min_mv < yMin) yMin = min_mv;
                if (max_mv > yMax) yMax = max_mv;
                
                const relative_time = (chunkStart - startIndex + (chunkEnd - chunkStart) / 2) * horiz_interval * timeFactor;
                detailOverviewData.push({time_us: relative_time, min_mv, max_mv});
            }
            
            loadingText.remove();
            yScale.domain([yMin, yMax]).nice();
            drawGridLines(svg, xScale, yScale, width, height);
            drawArea(svg, detailOverviewData, xScale, yScale, d => d.time_us, d => d.min_mv, d => d.max_mv);

        } else {
            // For smaller ranges, show all data points
            const chunkData = await getRawDataSlice(rawStoreObj, cacheObj, channel, trc, segment, startIndex, endIndex);
            const detailData = Array.from(chunkData).map((v, i) => ({
                time_us: i * horiz_interval * timeFactor,
                voltage_mv: adcToMv(v)
            }));
            
            loadingText.remove();
            yScale.domain(d3.extent(detailData, d => d.voltage_mv) || [0, 0]).nice();
            drawGridLines(svg, xScale, yScale, width, height);
            drawLine(svg, detailData, xScale, yScale, d => d.time_us, d => d.voltage_mv);
        }
        
        drawAxes(svg, xScale, yScale, timeUnitLabel, height, margin, width);
        
    } catch (error) {
        loadingText.text(`Error loading data: ${error.message}`);
        console.error('Error rendering detail chart:', error);
    }

    return svg;
}

export { getTimeUnitInfo, formatTimeDuration };
