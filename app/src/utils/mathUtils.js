/**
 * Math Utility using math.js
 * 
 * Provides functions for formatting numbers with appropriate SI prefixes
 * using math.js toBest() functionality for maximum human readability.
 * This replaces the previous siFormat utility.
 */

import { create, all } from 'mathjs';

// Create a math.js instance with all functions
const math = create(all);

/**
 * Format time duration from microseconds using math.js
 * Common case for this application
 * 
 * @param {number} valueInMicroseconds - Time value in microseconds
 * @param {number} precision - Number of significant digits (default: 3)
 * @returns {string} Formatted time string with appropriate SI prefix
 */
export function formatTimeFromMicroseconds(valueInMicroseconds, precision = 3) {
    // Convert microseconds to seconds for math.js
    const valueInSeconds = valueInMicroseconds / 1e6;
    
    // Handle special cases
    if (!isFinite(valueInSeconds) || isNaN(valueInSeconds)) {
        return `${valueInMicroseconds} µs`;
    }
    
    if (valueInSeconds === 0) {
        return '0 s';
    }
    
    // Use math.js format with toBest to get the best SI unit
    let formatted = math.format(math.unit(valueInSeconds, 's'), {notation: 'auto', precision: precision});
    
    // Fix the µs symbol (math.js uses 'us' instead of 'µs')
    formatted = formatted.replace(' us', ' µs');
    
    return formatted;
}

/**
 * Format time duration with appropriate SI prefix
 * Optimized for time values (seconds as base unit)
 * 
 * @param {number} valueInSeconds - Time value in seconds
 * @param {number} precision - Number of significant digits (default: 3)
 * @returns {string} Formatted time string with appropriate SI prefix
 */
export function formatTime(valueInSeconds, precision = 3) {
    // Handle special cases
    if (!isFinite(valueInSeconds) || isNaN(valueInSeconds)) {
        return `${valueInSeconds} s`;
    }
    
    if (valueInSeconds === 0) {
        return '0 s';
    }
    
    // Use math.js format with toBest to get the best SI unit
    let formatted = math.format(math.unit(valueInSeconds, 's'), {notation: 'auto', precision: precision});
    
    // Fix the µs symbol (math.js uses 'us' instead of 'µs')
    formatted = formatted.replace(' us', ' µs');
    
    return formatted;
}

/**
 * Format file size with appropriate binary or decimal prefix
 * 
 * @param {number} valueInBytes - File size in bytes
 * @param {boolean} useBinary - Use binary prefixes (default: true)
 * @param {number} precision - Number of significant digits (default: 3)
 * @returns {string} Formatted file size string
 */
export function formatFileSize(valueInBytes, useBinary = true, precision = 3) {
    // Handle special cases
    if (!isFinite(valueInBytes) || isNaN(valueInBytes)) {
        return `${valueInBytes} B`;
    }
    
    if (valueInBytes === 0) {
        return '0 B';
    }
    
    // Use math.js format with toBest to get the best unit
    const formatted = math.format(math.unit(valueInBytes, 'B'), {notation: 'auto', precision: precision});
    
    return formatted;
}

/**
 * Format frequency with appropriate SI prefix
 * 
 * @param {number} valueInHz - Frequency value in Hz
 * @param {number} precision - Number of significant digits (default: 3)
 * @returns {string} Formatted frequency string with appropriate SI prefix
 */
export function formatFrequency(valueInHz, precision = 3) {
    // Handle special cases
    if (!isFinite(valueInHz) || isNaN(valueInHz)) {
        return `${valueInHz} Hz`;
    }
    
    if (valueInHz === 0) {
        return '0 Hz';
    }
    
    // Use math.js format with toBest to get the best SI unit
    const formatted = math.format(math.unit(valueInHz, 'Hz'), {notation: 'auto', precision: precision});
    
    return formatted;
}

/**
 * Format voltage with appropriate SI prefix
 * 
 * @param {number} valueInVolts - Voltage value in volts
 * @param {number} precision - Number of significant digits (default: 3)
 * @returns {string} Formatted voltage string with appropriate SI prefix
 */
export function formatVoltage(valueInVolts, precision = 3) {
    // Handle special cases
    if (!isFinite(valueInVolts) || isNaN(valueInVolts)) {
        return `${valueInVolts} V`;
    }
    
    if (valueInVolts === 0) {
        return '0 V';
    }
    
    // Use math.js format with toBest to get the best SI unit
    const formatted = math.format(math.unit(valueInVolts, 'V'), {notation: 'auto', precision: precision});
    
    return formatted;
}

/**
 * Generic function to format any value with SI prefix using math.js
 * 
 * @param {number} value - Numeric value to format
 * @param {string} unit - Base unit (e.g., 's', 'Hz', 'V', 'B')
 * @param {number} precision - Number of significant digits (default: 3)
 * @returns {string} Formatted string with appropriate SI prefix
 */
export function formatWithSI(value, unit = '', precision = 3) {
    // Handle special cases
    if (!isFinite(value) || isNaN(value)) {
        return `${value} ${unit}`.trim();
    }
    
    if (value === 0) {
        return `0 ${unit}`.trim();
    }
    
    // If no unit specified, just format the number
    if (!unit) {
        return math.format(value, {notation: 'auto', precision: precision});
    }
    
    // Use math.js format with toBest to get the best SI unit
    const formatted = math.format(math.unit(value, unit), {notation: 'auto', precision: precision});
    
    return formatted;
}

/**
 * Parse a formatted SI string back to numeric value
 * Note: This is a simplified implementation as math.js handles parsing internally
 * 
 * @param {string} siString - String like "1.23 MHz" or "456 ns"
 * @returns {number} Numeric value in base units, or NaN if parsing fails
 */
export function parseFromSI(siString) {
    try {
        // Use math.js to parse the unit string
        const unit = math.unit(siString);
        return unit.toNumber();
    } catch (error) {
        console.warn('Failed to parse SI string:', siString, error);
        return NaN;
    }
}

export default {
    formatWithSI,
    formatTime,
    formatTimeFromMicroseconds,
    formatFileSize,
    formatFrequency,
    formatVoltage,
    parseFromSI
};