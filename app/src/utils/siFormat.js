/**
 * SI Format Utility
 * 
 * Provides functions for formatting numbers with appropriate SI prefixes
 * for maximum human readability across different units and scales.
 */

// Standard SI prefixes (decimal)
const SI_PREFIXES = [
    { factor: 1e24, symbol: 'Y', name: 'yotta' },
    { factor: 1e21, symbol: 'Z', name: 'zetta' },
    { factor: 1e18, symbol: 'E', name: 'exa' },
    { factor: 1e15, symbol: 'P', name: 'peta' },
    { factor: 1e12, symbol: 'T', name: 'tera' },
    { factor: 1e9, symbol: 'G', name: 'giga' },
    { factor: 1e6, symbol: 'M', name: 'mega' },
    { factor: 1e3, symbol: 'k', name: 'kilo' },
    { factor: 1, symbol: '', name: '' },
    { factor: 1e-3, symbol: 'm', name: 'milli' },
    { factor: 1e-6, symbol: 'µ', name: 'micro' },
    { factor: 1e-9, symbol: 'n', name: 'nano' },
    { factor: 1e-12, symbol: 'p', name: 'pico' },
    { factor: 1e-15, symbol: 'f', name: 'femto' },
    { factor: 1e-18, symbol: 'a', name: 'atto' },
    { factor: 1e-21, symbol: 'z', name: 'zepto' },
    { factor: 1e-24, symbol: 'y', name: 'yocto' }
];

// Binary prefixes for bytes/bits
const BINARY_PREFIXES = [
    { factor: Math.pow(1024, 8), symbol: 'Yi', name: 'yobi' },
    { factor: Math.pow(1024, 7), symbol: 'Zi', name: 'zebi' },
    { factor: Math.pow(1024, 6), symbol: 'Ei', name: 'exbi' },
    { factor: Math.pow(1024, 5), symbol: 'Pi', name: 'pebi' },
    { factor: Math.pow(1024, 4), symbol: 'Ti', name: 'tebi' },
    { factor: Math.pow(1024, 3), symbol: 'Gi', name: 'gibi' },
    { factor: Math.pow(1024, 2), symbol: 'Mi', name: 'mebi' },
    { factor: 1024, symbol: 'Ki', name: 'kibi' },
    { factor: 1, symbol: '', name: '' }
];

/**
 * Find the most appropriate SI prefix for a given value
 */
function findBestPrefix(value, prefixes, options = {}) {
    const absValue = Math.abs(value);
    const minThreshold = options.minThreshold ?? 0.1;
    const maxThreshold = options.maxThreshold ?? 1000;

    // Special case for zero
    if (value === 0) {
        return prefixes.find(p => p.factor === 1) || prefixes[0];
    }

    // Find the best prefix where the scaled value is within readable range
    for (const prefix of prefixes) {
        const scaledValue = absValue / prefix.factor;
        
        if (scaledValue >= minThreshold && scaledValue < maxThreshold) {
            return prefix;
        }
    }

    // Fallback: use the smallest or largest prefix
    return absValue < 1 
        ? prefixes[prefixes.length - 1] // smallest prefix
        : prefixes[0]; // largest prefix
}

/**
 * Format a number with the most appropriate SI prefix
 * 
 * @param {number} value - The numeric value to format
 * @param {Object} options - Formatting options
 * @param {number} options.precision - Number of decimal places (default: 2)
 * @param {number} options.minThreshold - Min threshold for unit selection (default: 0.1)
 * @param {number} options.maxThreshold - Max threshold for unit selection (default: 1000)
 * @param {boolean} options.binary - Use binary prefixes for bytes (default: false)
 * @param {string} options.unit - Unit symbol (default: '')
 * @returns {string} Formatted string with SI prefix and unit
 * 
 * @example
 * formatWithSI(0.000000123, { unit: 's' }) // "123 ns"
 * formatWithSI(1234567, { unit: 'B' }) // "1.23 MB"
 * formatWithSI(1234567, { unit: 'B', binary: true }) // "1.18 MiB"
 */
export function formatWithSI(value, options = {}) {
    const {
        precision = 2,
        binary = false,
        unit = ''
    } = options;

    // Handle special cases
    if (!isFinite(value) || isNaN(value)) {
        return `${value} ${unit}`.trim();
    }

    const prefixes = binary ? BINARY_PREFIXES : SI_PREFIXES;
    const bestPrefix = findBestPrefix(value, prefixes, options);
    
    const scaledValue = value / bestPrefix.factor;
    const formattedValue = scaledValue.toFixed(precision);
    
    // Remove trailing zeros after decimal point
    const cleanValue = parseFloat(formattedValue).toString();
    
    return `${cleanValue} ${bestPrefix.symbol}${unit}`.trim();
}

/**
 * Format time duration with appropriate SI prefix
 * Optimized for time values (seconds as base unit)
 */
export function formatTime(valueInSeconds, precision = 2) {
    return formatWithSI(valueInSeconds, {
        precision,
        unit: 's',
        minThreshold: 0.1,
        maxThreshold: 1000
    });
}

/**
 * Format time duration from microseconds
 * Common case for this application
 */
export function formatTimeFromMicroseconds(valueInMicroseconds, precision = 2) {
    const valueInSeconds = valueInMicroseconds / 1e6;
    return formatTime(valueInSeconds, precision);
}

/**
 * Format file size with appropriate binary or decimal prefix
 */
export function formatFileSize(valueInBytes, useBinary = true, precision = 2) {
    return formatWithSI(valueInBytes, {
        precision,
        unit: 'B',
        binary: useBinary,
        minThreshold: 0.1,
        maxThreshold: 1024
    });
}

/**
 * Format frequency with appropriate SI prefix
 */
export function formatFrequency(valueInHz, precision = 2) {
    return formatWithSI(valueInHz, {
        precision,
        unit: 'Hz',
        minThreshold: 0.1,
        maxThreshold: 1000
    });
}

/**
 * Format voltage with appropriate SI prefix
 */
export function formatVoltage(valueInVolts, precision = 2) {
    return formatWithSI(valueInVolts, {
        precision,
        unit: 'V',
        minThreshold: 0.1,
        maxThreshold: 1000
    });
}

/**
 * Parse a formatted SI string back to numeric value
 * 
 * @param {string} siString - String like "1.23 MHz" or "456 ns"
 * @returns {number} Numeric value in base units, or NaN if parsing fails
 */
export function parseFromSI(siString) {
    const match = siString.match(/^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*([a-zA-Zµ]*)/);
    
    if (!match) return NaN;
    
    const [, valueStr, prefixAndUnit] = match;
    const value = parseFloat(valueStr);
    
    if (isNaN(value)) return NaN;
    
    // Extract prefix from the beginning of prefixAndUnit
    const allPrefixes = [...SI_PREFIXES, ...BINARY_PREFIXES];
    
    for (const prefix of allPrefixes) {
        if (prefix.symbol && prefixAndUnit.startsWith(prefix.symbol)) {
            return value * prefix.factor;
        }
    }
    
    // No prefix found, return base value
    return value;
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
