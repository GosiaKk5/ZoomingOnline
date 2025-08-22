import * as d3 from 'd3';
import { createChartSVG, drawAxes, drawGridLines, drawArea, drawZoomRectangle } from '../../renderers/chartRenderer';
import type { OverviewDataPoint } from './ChartDataService';

export interface OverviewRenderConfig {
  data: OverviewDataPoint[];
  totalTime: number;
  globalYMin: number;
  globalYMax: number;
  zoomLevel: number | null;
  zoomPosition: number;
  onZoomPositionChange?: (position: number) => void;
}

export interface DetailRenderConfig {
  data: OverviewDataPoint[];
  timeDomain: [number, number];
  yDomain: [number, number];
  title: string;
}

/**
 * Service for handling D3 chart rendering
 * Encapsulates all D3 logic and DOM manipulation
 */
export class ChartRenderService {
  private container: HTMLElement;
  private svg: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private onResize: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupResizeObserver();
  }

  /**
   * Render the overview chart with zoom rectangle
   */
  renderOverview(config: OverviewRenderConfig): void {
    if (!config.data || config.data.length === 0) return;

    this.clearContainer();

    const { width, height, margin } = this.getChartDimensions(150); // Overview height: 150px
    
    // Create SVG
    this.svg = createChartSVG(
      this.container,
      margin,
      width,
      height,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom
    );

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, config.totalTime])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([config.globalYMin, config.globalYMax])
      .range([height, 0]);

    // Draw chart elements
    drawAxes(this.svg, xScale, yScale, "Time (s)", height, margin, width);
    drawGridLines(this.svg, xScale, yScale, width, height);

    // Draw data
    drawArea(
      this.svg,
      config.data,
      xScale,
      yScale,
      (d: any) => d.time_s,
      (d: any) => d.min_mv,
      (d: any) => d.max_mv
    );

    // Add zoom rectangle if zoom is active
    if (config.zoomLevel !== null && config.zoomLevel < config.totalTime) {
      const zoomWidth = config.zoomLevel / config.totalTime; // Convert to fraction
      
      drawZoomRectangle(
        this.svg,
        xScale,
        height,
        config.zoomPosition,
        zoomWidth,
        config.totalTime,
        config.onZoomPositionChange || (() => {})
      );
    }

    // Add chart title
    this.svg.append("text")
      .attr("x", width / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", "#6b7280")
      .text("Overview");
  }

  /**
   * Render the detail chart
   */
  renderDetail(config: DetailRenderConfig): void {
    if (!config.data || config.data.length === 0) return;

    this.clearContainer();

    const { width, height, margin } = this.getChartDimensions(300); // Detail height: 300px
    
    // Create SVG
    this.svg = createChartSVG(
      this.container,
      margin,
      width,
      height,
      width + margin.left + margin.right,
      height + margin.top + margin.bottom
    );

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(config.timeDomain)
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(config.yDomain)
      .range([height, 0]);

    // Draw chart elements
    drawAxes(this.svg, xScale, yScale, "Time (s)", height, margin, width);
    drawGridLines(this.svg, xScale, yScale, width, height);

    // Draw data
    drawArea(
      this.svg,
      config.data,
      xScale,
      yScale,
      (d: any) => d.time_s,
      (d: any) => d.min_mv,
      (d: any) => d.max_mv
    );

    // Add chart title
    this.svg.append("text")
      .attr("x", width / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "500")
      .style("fill", "#374151")
      .text(config.title);
  }

  /**
   * Set up resize observer to handle container size changes
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.onResize) {
          // Debounce resize events
          setTimeout(() => this.onResize?.(), 100);
        }
      });
      
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * Set resize callback
   */
  setResizeCallback(callback: () => void): void {
    this.onResize = callback;
  }

  /**
   * Get chart dimensions based on container size
   */
  private getChartDimensions(targetHeight: number) {
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    const containerRect = this.container.getBoundingClientRect();
    const width = Math.max(300, containerRect.width - margin.left - margin.right);
    const height = targetHeight - margin.top - margin.bottom;
    
    return { width, height, margin };
  }

  /**
   * Clear the container
   */
  private clearContainer(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.svg = null;
  }

  /**
   * Destroy the service and clean up resources
   */
  destroy(): void {
    this.clearContainer();
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    this.onResize = null;
  }
}