/**
 * chartRenderer.ts
 *
 * Chart rendering utility adapted for Svelte store-based state management.
 * Handles D3.js visualization of time series data with multi-level zoom functionality.
 */

import * as d3 from "d3";
import { formatTime } from "./mathUtils.ts";

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
  total_time_s: number;
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
  time_s: number;
  min_mv: number;
  max_mv: number;
}

export interface TimeUnitInfo {
  useNanoseconds: boolean;
  timeUnitLabel: string;
}

// Threshold for switching to nanosecond display (in seconds)
const NANOSECOND_THRESHOLD_S = 0.5e-6;

/**
 * Helper function to determine appropriate time unit and label
 */
function getTimeUnitInfo(timeSpanS: number): TimeUnitInfo {
  const useNanoseconds = timeSpanS <= NANOSECOND_THRESHOLD_S;
  const timeUnitLabel = useNanoseconds
    ? "Relative Time [ns]"
    : "Relative Time [s]";
  return { useNanoseconds, timeUnitLabel };
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
  segment: number,
): Promise<PlotDataResult> {
  console.log("🏗️ initializePlotData() called");
  console.log("  - channel:", channel, "trc:", trc, "segment:", segment);
  console.log("  - rawStore shape:", rawStore?.shape);
  console.log("  - zarrGroup exists:", !!zarrGroup);
  console.log("  - overviewStore exists:", !!overviewStore);

  try {
    // Extract metadata from Zarr attributes
    console.log("📝 Extracting Zarr attributes...");
    const attrs = await zarrGroup.attrs.asObject();
    console.log("  - attrs:", attrs);

    const horiz_interval = attrs.horiz_interval as number;
    const vertical_gains = attrs.vertical_gains as number[][][];
    const vertical_offsets = attrs.vertical_offsets as number[][][];

    console.log("📊 Metadata extracted:");
    console.log("  - horiz_interval:", horiz_interval);
    console.log("  - vertical_gains:", vertical_gains);
    console.log("  - vertical_offsets:", vertical_offsets);

    const vertical_gain = vertical_gains[channel]?.[trc];
    const vertical_offset = vertical_offsets[channel]?.[trc];

    if (
      typeof vertical_gain !== "number" ||
      typeof vertical_offset !== "number"
    ) {
      throw new Error("Invalid vertical gain or offset values");
    }
    const no_of_samples = rawStore.shape[3] as number;

    console.log("📈 Calculated values:");
    console.log("  - vertical_gain:", vertical_gain);
    console.log("  - vertical_offset:", vertical_offset);
    console.log("  - no_of_samples:", no_of_samples);

    // Function to convert ADC values to millivolts
    const adcToMilliVolts = (adc: number): number =>
      1000 * (adc * vertical_gain - vertical_offset);
    const total_time_s = (no_of_samples - 1) * horiz_interval;

    console.log("⏰ Time calculation:");
    console.log("  - horiz_interval:", horiz_interval);
    console.log(
      "  - total_time_s calculation:",
      `(${no_of_samples} - 1) * ${horiz_interval}`,
    );
    console.log("  - total_time_s result:", total_time_s);
    console.log(
      "  - total_time_s is valid:",
      !isNaN(total_time_s) && isFinite(total_time_s),
    );

    // Chart dimensions
    const margin: ChartMargin = { top: 40, right: 40, bottom: 50, left: 60 };
    const fullWidth = 900;
    const chartHeight = 300;
    const width = fullWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    console.log("📏 Chart dimensions:", {
      margin,
      fullWidth,
      chartHeight,
      width,
      height,
    });

    // Load overview (downsampled) data
    console.log("🔍 Loading overview data...");
    const overviewSlice = await overviewStore.get([
      channel,
      trc,
      segment,
      null,
      null,
    ]);
    const overviewMin = (await overviewSlice.get(0)).data as number[];
    const overviewMax = (await overviewSlice.get(1)).data as number[];
    const downsampling_factor = no_of_samples / overviewMin.length;

    console.log("📊 Overview data loaded:");
    console.log("  - overviewMin length:", overviewMin.length);
    console.log("  - overviewMax length:", overviewMax.length);
    console.log("  - downsampling_factor:", downsampling_factor);
    console.log("  - no_of_samples (raw):", no_of_samples);
    console.log("  - horiz_interval:", horiz_interval);

    // Process overview data for plotting
    console.log("🔄 Processing overview data...");
    const overviewData: OverviewDataPoint[] = Array.from(overviewMin).map(
      (min_val, i) => {
        const time_s =
          (i + 0.5) * downsampling_factor * horiz_interval;
        const maxVal = overviewMax[i];
        if (typeof maxVal === "undefined") {
          throw new Error(`Missing overview max value at index ${i}`);
        }
        return {
          time_s,
          min_mv: adcToMilliVolts(min_val),
          max_mv: adcToMilliVolts(maxVal),
        };
      },
    );

    // Calculate global Y-axis limits
    const globalYMin = d3.min(overviewData, (d) => d.min_mv);
    const globalYMax = d3.max(overviewData, (d) => d.max_mv);

    console.log("📈 Overview data processing complete:");
    console.log("  - overviewData length:", overviewData.length);
    console.log("  - First data point time_s:", overviewData[0]?.time_s);
    console.log(
      "  - Last data point time_s:",
      overviewData[overviewData.length - 1]?.time_s,
    );
    console.log("  - Expected total_time_s:", total_time_s);
    console.log(
      "  - Time range coverage:",
      `${overviewData[0]?.time_s} - ${overviewData[overviewData.length - 1]?.time_s}`,
    );
    console.log("  - globalYMin:", globalYMin, "globalYMax:", globalYMax);
    console.log("  - overviewData sample (first 3):", overviewData.slice(0, 3));
    console.log("  - overviewData sample (last 3):", overviewData.slice(-3));

    const result: PlotDataResult = {
      margin,
      width,
      height,
      fullWidth,
      chartHeight,
      horiz_interval,
      no_of_samples,
      total_time_s,
      adcToMv: adcToMilliVolts,
      channel,
      trc,
      segment,
      overviewData,
      globalYMin,
      globalYMax,
      validTimeSteps: [],
      validZoom2Steps: [],
    };

    console.log("✅ initializePlotData completed successfully");
    return result;
  } catch (error) {
    console.error("❌ Error in initializePlotData:");
    console.error("  - Error:", error);
    console.error("  - Error stack:", (error as Error).stack);
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
  chartHeight: number,
): d3.Selection<SVGGElement, unknown, null, undefined> {
  console.log("🎨 createChartSVG() called");
  console.log("  - title:", title);
  console.log("  - containerElement exists:", !!containerElement);
  console.log("  - margin:", margin);
  console.log(
    "  - width:",
    width,
    "type:",
    typeof width,
    "isValid:",
    !isNaN(width) && isFinite(width),
  );
  console.log(
    "  - height:",
    height,
    "type:",
    typeof height,
    "isValid:",
    !isNaN(height) && isFinite(height),
  );
  console.log(
    "  - fullWidth:",
    fullWidth,
    "type:",
    typeof fullWidth,
    "isValid:",
    !isNaN(fullWidth) && isFinite(fullWidth),
  );
  console.log(
    "  - chartHeight:",
    chartHeight,
    "type:",
    typeof chartHeight,
    "isValid:",
    !isNaN(chartHeight) && isFinite(chartHeight),
  );

  // Validate parameters
  if (
    isNaN(width) ||
    isNaN(height) ||
    isNaN(fullWidth) ||
    isNaN(chartHeight) ||
    !isFinite(width) ||
    !isFinite(height) ||
    !isFinite(fullWidth) ||
    !isFinite(chartHeight)
  ) {
    console.error("❌ Invalid dimensions passed to createChartSVG");
    console.error(
      "  - width:",
      width,
      "height:",
      height,
      "fullWidth:",
      fullWidth,
      "chartHeight:",
      chartHeight,
    );
    throw new Error("Invalid dimensions passed to createChartSVG");
  }

  // Clear existing content
  console.log("🧹 Clearing existing content...");
  d3.select(containerElement).selectAll("*").remove();

  console.log(
    "📐 Creating SVG with viewBox:",
    `0 0 ${fullWidth} ${chartHeight}`,
  );
  const svg = d3
    .select(containerElement)
    .append("svg")
    .attr("viewBox", `0 0 ${fullWidth} ${chartHeight}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  console.log("📝 Adding title and labels...");

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "600")
    .text(title);

  // Add y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left + 15)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Voltage [mV]");

  console.log("✅ SVG created successfully");
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
  width: number,
): void {
  // Create x-axis with better formatted time values
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3.axisBottom(xScale).ticks(5).tickFormat((d) => {
        const timeInSeconds = Number(d);
        return formatTime(timeInSeconds);
      })
    );

  svg.append("g").call(d3.axisLeft(yScale).ticks(5));

  svg
    .append("text")
    .attr(
      "transform",
      `translate(${width / 2}, ${height + margin.bottom - 10})`,
    )
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
  height: number,
): void {
  // Add horizontal grid lines
  svg
    .append("g")
    .attr("class", "grid-lines")
    .selectAll("line.horizontal-grid")
    .data(yScale.ticks(5))
    .enter()
    .append("line")
    .attr("class", "horizontal-grid")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", (d) => yScale(d))
    .attr("y2", (d) => yScale(d))
    .attr("stroke", "black")
    .attr("stroke-width", 0.5)
    .attr("opacity", 0.2);

  // Add vertical grid lines
  svg
    .append("g")
    .attr("class", "grid-lines")
    .selectAll("line.vertical-grid")
    .data(xScale.ticks(5))
    .enter()
    .append("line")
    .attr("class", "vertical-grid")
    .attr("x1", (d) => xScale(d))
    .attr("x2", (d) => xScale(d))
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
  y1Acc: (d: T) => number,
): void {
  svg
    .append("path")
    .datum(data)
    .attr("fill", "#000")
    .attr(
      "d",
      d3
        .area<T>()
        .x((d) => xScale(xAcc(d)))
        .y0((d) => yScale(y0Acc(d)))
        .y1((d) => yScale(y1Acc(d))),
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
  yAcc: (d: T) => number,
): void {
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      d3
        .line<T>()
        .x((d) => xScale(xAcc(d)))
        .y((d) => yScale(yAcc(d))),
    );
}

export { getTimeUnitInfo };
