/**
 * chartRenderer.ts
 * 
 * Chart rendering utility adapted for Svelte store-based state management.
 * Handles D3.js visualization of time series data with multi-level zoom functionality.
 */

import * as d3 from 'd3';
import { formatTimeFromMicroseconds } from './mathUtils.ts';
import { getRawDataSlice } from './dataLoader.ts';
import type { CacheEntry } from '../stores/appStore.ts';

// Type definitions
export interface ChartMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface PlotDataResult {
    margin: ChartMargin;
    width: number;
    height: number;
    fullWidth: number;
    chartHeight: number;
    horiz_interval: number;
    no_of_samples: number;
    total_time_us: number;
    adcToMv: (adc: number) => number;
    channel: number;
    trc: number;
    segment: number;
    overviewData: OverviewDataPoint[];
    globalYMin: number | undefined;
    globalYMax: number | undefined;
    validTimeSteps: any[];
    validZoom2Steps: any[];
}

export interface OverviewDataPoint {
    time_us: number;
    min_mv: number;
    max_mv: number;
}

export interface TimeUnitInfo {
    useNanoseconds: boolean;
    timeUnitLabel: string;
}

// Constants for time conversions
const S_TO_US_FACTOR = 1e6;
const S_TO_NS_FACTOR = 1e9;

// Threshold for switching to nanosecond display (in microseconds)
const NANOSECOND_THRESHOLD_US = 0.5;

// Detail view threshold for decimation
const DETAIL_THRESHOLD = 40000;

/**
 * Helper function to determine appropriate time unit and label
 */
function getTimeUnitInfo(timeSpanUs: number): TimeUnitInfo {
    const useNanoseconds = timeSpanUs <= NANOSECOND_THRESHOLD_US;
    const timeUnitLabel = useNanoseconds ? "Relative Time [ns]" : "Relative Time [µs]";
    return { useNanoseconds, timeUnitLabel };
}

/**
 * Helper function to format time duration with appropriate SI units
 */
function formatTimeDuration(durationUs: number, _useNanoseconds = false): string {
    // Use the new SI formatting utility for better readability
    return formatTimeFromMicroseconds(durationUs);
}

/**
 * Initialize plot configuration and process overview data
 */
export async function initializePlotData(
    rawStore: any, 
    zarrGroup: any, 
    overviewStore: any, 
    channel: number, 
    trc: number, 
    segment: number
): Promise<PlotDataResult> {
    console.log('🏗️ initializePlotData() called');
    console.log('  - channel:', channel, 'trc:', trc, 'segment:', segment);
    console.log('  - rawStore shape:', rawStore?.shape);
    console.log('  - zarrGroup exists:', !!zarrGroup);
    console.log('  - overviewStore exists:', !!overviewStore);
    
    try {
        // Extract metadata from Zarr attributes
        console.log('📝 Extracting Zarr attributes...');
        const attrs = await zarrGroup.attrs.asObject();
        console.log('  - attrs:', attrs);
        
        const horiz_interval = attrs.horiz_interval as number;
        const vertical_gains = attrs.vertical_gains as number[][][];
        const vertical_offsets = attrs.vertical_offsets as number[][][];
        
        console.log('📊 Metadata extracted:');
        console.log('  - horiz_interval:', horiz_interval);
        console.log('  - vertical_gains:', vertical_gains);
        console.log('  - vertical_offsets:', vertical_offsets);
        
        const vertical_gain = vertical_gains[channel]?.[trc];
        const vertical_offset = vertical_offsets[channel]?.[trc];
        
        if (typeof vertical_gain !== 'number' || typeof vertical_offset !== 'number') {
            throw new Error('Invalid vertical gain or offset values');
        }
        const no_of_samples = rawStore.shape[3] as number;
        
        console.log('📈 Calculated values:');
        console.log('  - vertical_gain:', vertical_gain);
        console.log('  - vertical_offset:', vertical_offset);
        console.log('  - no_of_samples:', no_of_samples);
        
        // Function to convert ADC values to millivolts
        const adcToMilliVolts = (adc: number): number => 1000 * (adc * vertical_gain - vertical_offset);
        const total_time_us = (no_of_samples - 1) * horiz_interval * S_TO_US_FACTOR;
        
        console.log('⏰ Time calculation:');
        console.log('  - S_TO_US_FACTOR:', S_TO_US_FACTOR);
        console.log('  - total_time_us calculation:', `(${no_of_samples} - 1) * ${horiz_interval} * ${S_TO_US_FACTOR}`);
        console.log('  - total_time_us result:', total_time_us);
        console.log('  - total_time_us is valid:', !isNaN(total_time_us) && isFinite(total_time_us));

        // Chart dimensions
        const margin: ChartMargin = {top: 40, right: 40, bottom: 50, left: 60};
        const fullWidth = 900;
        const chartHeight = 300;
        const width = fullWidth - margin.left - margin.right;
        const height = chartHeight - margin.top - margin.bottom;

        console.log('📏 Chart dimensions:', { margin, fullWidth, chartHeight, width, height });

        // Load overview (downsampled) data
        console.log('🔍 Loading overview data...');
        const overviewSlice = await overviewStore.get([channel, trc, segment, null, null]);
        const overviewMin = (await overviewSlice.get(0)).data as number[];
        const overviewMax = (await overviewSlice.get(1)).data as number[];
        const downsampling_factor = no_of_samples / overviewMin.length;
        
        console.log('📊 Overview data loaded:');
        console.log('  - overviewMin length:', overviewMin.length);
        console.log('  - overviewMax length:', overviewMax.length);
        console.log('  - downsampling_factor:', downsampling_factor);
        console.log('  - no_of_samples (raw):', no_of_samples);
        console.log('  - horiz_interval:', horiz_interval);

        // Process overview data for plotting
        console.log('🔄 Processing overview data...');
        const overviewData: OverviewDataPoint[] = Array.from(overviewMin).map((min_val, i) => {
            const time_us = (i + 0.5) * downsampling_factor * horiz_interval * S_TO_US_FACTOR;
            const maxVal = overviewMax[i];
            if (typeof maxVal === 'undefined') {
                throw new Error(`Missing overview max value at index ${i}`);
            }
            return {
                time_us,
                min_mv: adcToMilliVolts(min_val),
                max_mv: adcToMilliVolts(maxVal)
            };
        });

        // Calculate global Y-axis limits
        const globalYMin = d3.min(overviewData, d => d.min_mv);
        const globalYMax = d3.max(overviewData, d => d.max_mv);
        
        console.log('📈 Overview data processing complete:');
        console.log('  - overviewData length:', overviewData.length);
        console.log('  - First data point time_us:', overviewData[0]?.time_us);
        console.log('  - Last data point time_us:', overviewData[overviewData.length - 1]?.time_us);
        console.log('  - Expected total_time_us:', total_time_us);
        console.log('  - Time range coverage:', `${overviewData[0]?.time_us} - ${overviewData[overviewData.length - 1]?.time_us}`);
        console.log('  - globalYMin:', globalYMin, 'globalYMax:', globalYMax);
        console.log('  - overviewData sample (first 3):', overviewData.slice(0, 3));
        console.log('  - overviewData sample (last 3):', overviewData.slice(-3));

        const result: PlotDataResult = {
            margin, width, height, fullWidth, chartHeight,
            horiz_interval, no_of_samples, total_time_us,
            adcToMv: adcToMilliVolts,
            channel, trc, segment,
            overviewData, globalYMin, globalYMax,
            validTimeSteps: [],
            validZoom2Steps: []
        };
        
        console.log('✅ initializePlotData completed successfully');
        return result;
        
    } catch (error) {
        console.error('❌ Error in initializePlotData:');
        console.error('  - Error:', error);
        console.error('  - Error stack:', (error as Error).stack);
        throw error;
    }
}

/**
 * Create SVG container for a chart with title and y-axis label
 */
export function createChartSVG(
    containerElement: HTMLElement, 
    title: string, 
    margin: ChartMargin, 
    width: number, 
    height: number, 
    fullWidth: number, 
    chartHeight: number
): d3.Selection<SVGGElement, unknown, null, undefined> {
    console.log('🎨 createChartSVG() called');
    console.log('  - title:', title);
    console.log('  - containerElement exists:', !!containerElement);
    console.log('  - margin:', margin);
    console.log('  - width:', width, 'type:', typeof width, 'isValid:', !isNaN(width) && isFinite(width));
    console.log('  - height:', height, 'type:', typeof height, 'isValid:', !isNaN(height) && isFinite(height));
    console.log('  - fullWidth:', fullWidth, 'type:', typeof fullWidth, 'isValid:', !isNaN(fullWidth) && isFinite(fullWidth));
    console.log('  - chartHeight:', chartHeight, 'type:', typeof chartHeight, 'isValid:', !isNaN(chartHeight) && isFinite(chartHeight));
    
    // Validate parameters
    if (isNaN(width) || isNaN(height) || isNaN(fullWidth) || isNaN(chartHeight) ||
        !isFinite(width) || !isFinite(height) || !isFinite(fullWidth) || !isFinite(chartHeight)) {
        console.error('❌ Invalid dimensions passed to createChartSVG');
        console.error('  - width:', width, 'height:', height, 'fullWidth:', fullWidth, 'chartHeight:', chartHeight);
        throw new Error('Invalid dimensions passed to createChartSVG');
    }
    
    // Clear existing content
    console.log('🧹 Clearing existing content...');
    d3.select(containerElement).selectAll("*").remove();
    
    console.log('📐 Creating SVG with viewBox:', `0 0 ${fullWidth} ${chartHeight}`);
    const svg = d3.select(containerElement)
        .append("svg")
        .attr("viewBox", `0 0 ${fullWidth} ${chartHeight}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    console.log('📝 Adding title and labels...');
    
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

    console.log('✅ SVG created successfully');
    return svg;
}

/**
 * Draw x and y axes on the chart
 */
export function drawAxes(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>, 
    xScale: d3.ScaleLinear<number, number>, 
    yScale: d3.ScaleLinear<number, number>, 
    xLabel: string, 
    height: number, 
    margin: ChartMargin, 
    width: number
): void {
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
export function drawGridLines(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>, 
    xScale: d3.ScaleLinear<number, number>, 
    yScale: d3.ScaleLinear<number, number>, 
    width: number, 
    height: number
): void {
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
export function drawArea<T>(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>, 
    data: T[], 
    xScale: d3.ScaleLinear<number, number>, 
    yScale: d3.ScaleLinear<number, number>, 
    xAcc: (d: T) => number, 
    y0Acc: (d: T) => number, 
    y1Acc: (d: T) => number
): void {
    svg.append("path")
        .datum(data)
        .attr("fill", "#000")
        .attr("d", d3.area<T>()
            .x(d => xScale(xAcc(d)))
            .y0(d => yScale(y0Acc(d)))
            .y1(d => yScale(y1Acc(d)))
        );
}

/**
 * Draw a line chart
 */
export function drawLine<T>(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>, 
    data: T[], 
    xScale: d3.ScaleLinear<number, number>, 
    yScale: d3.ScaleLinear<number, number>, 
    xAcc: (d: T) => number, 
    yAcc: (d: T) => number
): void {
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line<T>()
            .x(d => xScale(xAcc(d)))
            .y(d => yScale(yAcc(d)))
        );
}

/**
 * Add draggable zoom rectangle with position callback
 */
export function addDragHandler(
    target: d3.Selection<SVGRectElement, unknown, null, undefined>, 
    width: number, 
    onPositionChange?: (percentage: number) => void
): void {
    let startX: number, rectX: number, rectWidth: number;
    
    const drag = d3.drag<SVGRectElement, unknown>()
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
        .on("end", function() {
            target.classed("dragging", false);
        });
        
    target.call(drag);
}

/**
 * Render detailed data for zoom charts
 */
export async function renderDetailChart(
    containerElement: HTMLElement, 
    domain_us: [number, number], 
    plotConfig: PlotDataResult, 
    rawStoreObj: any, 
    cacheObj: CacheEntry,
    title: string
): Promise<d3.Selection<SVGGElement, unknown, null, undefined>> {
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
    const relativeTimeRange: [number, number] = [relativeStartTime, relativeEndTime];

    // Create scales
    const xScale = d3.scaleLinear().domain(relativeTimeRange).range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);

    try {
        // For large data ranges, use decimation
        if (visibleSampleWidth > DETAIL_THRESHOLD) {
            const target_points = 4000;
            const step = Math.max(1, Math.floor(visibleSampleWidth / target_points));
            const detailOverviewData: OverviewDataPoint[] = [];
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
            const extent = d3.extent(detailData, d => d.voltage_mv);
            const domain = extent[0] !== undefined && extent[1] !== undefined ? extent : [0, 0];
            yScale.domain(domain).nice();
            drawGridLines(svg, xScale, yScale, width, height);
            drawLine(svg, detailData, xScale, yScale, d => d.time_us, d => d.voltage_mv);
        }
        
        drawAxes(svg, xScale, yScale, timeUnitLabel, height, margin, width);
        
    } catch (error) {
        loadingText.text(`Error loading data: ${(error as Error).message}`);
        console.error('Error rendering detail chart:', error);
    }

    return svg;
}

export { getTimeUnitInfo, formatTimeDuration };