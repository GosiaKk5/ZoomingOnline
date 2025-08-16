/**
 * Math Utility using math.js
 * 
 * Provides functions for formatting numbers with appropriate SI prefixes
 * using math.js toBest() functionality for maximum human readability.
 * This replaces the previous siFormat utility.
 */

import { create, all, type MathJsInstance } from 'mathjs';

// Create a math.js instance with all functions
const math = create(all!) as MathJsInstance;

/**
 * Format time duration from microseconds using math.js
 * Common case for this application
 */
export function formatTimeFromMicroseconds(valueInMicroseconds: number, precision = 3): string {
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
 */
export function formatTime(valueInSeconds: number, precision = 3): string {
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
 */
export function formatFileSize(valueInBytes: number, _useBinary = true, precision = 3): string {
    // Handle special cases
    if (!isFinite(valueInBytes) || isNaN(valueInBytes)) {
        return `${valueInBytes} B`;
    }
    
    if (valueInBytes === 0) {
        return '0 B';
    }
    
    // Use math.js format with toBest to get the best unit
    // Note: _useBinary parameter preserved for API compatibility but math.js handles unit selection automatically
    const formatted = math.format(math.unit(valueInBytes, 'B'), {notation: 'auto', precision: precision});
    
    return formatted;
}

/**
 * Format frequency with appropriate prefix (Hz, kHz, MHz, GHz, etc.)
 */
export function formatFrequency(valueInHz: number, _unit = 'Hz', precision = 3): string {
    // Handle special cases
    if (!isFinite(valueInHz) || isNaN(valueInHz)) {
        return `${valueInHz} Hz`;
    }
    
    if (valueInHz === 0) {
        return '0 Hz';
    }
    
    // Use math.js format with toBest to get the best unit
    // Note: _unit parameter preserved for API compatibility
    const formatted = math.format(math.unit(valueInHz, 'Hz'), {notation: 'auto', precision: precision});
    
    return formatted;
}

/**
 * Format voltage with appropriate SI prefix
 */
export function formatVoltage(valueInVolts: number, precision = 3): string {
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
 */
export function formatWithSI(value: number, unit = '', precision = 3): string {
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
 */
export function parseFromSI(siString: string): number {
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