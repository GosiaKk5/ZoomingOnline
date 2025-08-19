/**
 * Utility functions for generating zoom levels for time-based data visualization.
 * 
 * Zoom levels are expressed as time spans and are generated as powers of 10
 * with multiplicative factors of 1, 2, and 5.
 */

import { formatTime } from './mathUtils.js';

/**
 * Generates scale levels (multiples of 1, 2, 5 × 10^n) within a numeric range.
 * @param lowerLimit - The minimum allowed value (inclusive, must be > 0)
 * @param upperLimit - The maximum allowed value (inclusive, must be > lowerLimit)
 * @returns Array of scale levels sorted from smallest to largest
 */
export function generateZoomLevels(lowerLimit: number, upperLimit: number): number[] {
    if (lowerLimit <= 0 || upperLimit <= 0) {
        throw new Error("Both limits must be positive numbers");
    }

    if (lowerLimit >= upperLimit) {
        throw new Error("lowerLimit must be smaller than upperLimit");
    }

    const factors = [1, 2, 5];
    const levels: number[] = [];
 
    // Start from the power of 10 that is just below the lower limit
    let currentPower = Math.pow(10, Math.floor(Math.log10(lowerLimit)));

    while (currentPower < upperLimit) {
        for (const factor of factors) {
            const value = currentPower * factor;
            if (value > lowerLimit && value < upperLimit) {
                levels.push(value);
            }
        }
        currentPower *= 10;
    }

    // Ensure sorted unique values and clamp to half of upperLimit to avoid overly wide zooms
    const epsilon = upperLimit * 1e-12; // tiny tolerance for floating point comparisons
    const maxAllowed = upperLimit / 2 + epsilon;
    return [...new Set(levels)]
        .filter(v => v <= maxAllowed)
        .sort((a, b) => a - b);
}

/**
 * Generates zoom levels with human-readable labels
 * @param lowerLimit - The minimum time resolution between data points (in seconds)
 * @param upperLimit - The total duration of the data segment (in seconds)
 * @returns Array of objects with value (in seconds) and label (human-readable string)
 */
export function generateZoomLevelsWithLabels(lowerLimit: number, upperLimit: number): Array<{ value: number; label: string }> {
    const zoomLevels = generateZoomLevels(lowerLimit, upperLimit);
    
    return zoomLevels.map(level => ({
        value: level,
        label: formatTime(level, 3)
    }));
}