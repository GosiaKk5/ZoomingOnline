import { describe, it, expect } from 'vitest';
import {
    formatTime,
    formatFileSize,
    formatFrequency,
    formatVoltage,
    formatWithSI
} from './mathUtils.js';

describe('mathUtils', () => {
    describe('formatTime', () => {
        it('should format seconds correctly', () => {
            expect(formatTime(1)).toBe('1 s');
            expect(formatTime(2.5)).toBe('2.5 s');
        });

        it('should format milliseconds correctly', () => {
            expect(formatTime(0.001)).toBe('1 ms');
            expect(formatTime(0.020)).toBe('20 ms');
            expect(formatTime(0.0005)).toBe('500 µs'); // 0.5ms is more accurately expressed as 500µs
        });

        it('should format microseconds correctly', () => {
            expect(formatTime(1e-6)).toBe('1 µs');
            expect(formatTime(50e-6)).toBe('50 µs');
            expect(formatTime(0.5e-6)).toBe('500 ns'); // 0.5µs is more accurately expressed as 500ns
        });

        it('should format nanoseconds correctly', () => {
            expect(formatTime(1e-9)).toBe('1 ns');
            expect(formatTime(100e-9)).toBe('100 ns');
            expect(formatTime(0.5e-9)).toBe('500 ps'); // 0.5ns is more accurately expressed as 500ps
        });

        it('should format picoseconds correctly', () => {
            expect(formatTime(1e-12)).toBe('1 ps');
            expect(formatTime(500e-12)).toBe('500 ps');
            expect(formatTime(0.2e-12)).toBe('200 fs'); // Math.js converts to femtoseconds for very small values
        });

        it('should handle edge cases', () => {
            expect(formatTime(0)).toBe('0 s');
            expect(formatTime(NaN)).toContain('NaN');
            expect(formatTime(Infinity)).toContain('Infinity');
        });

        it('should respect precision parameter', () => {
            expect(formatTime(1.23456789, 2)).toBe('1.2 s');
            expect(formatTime(1.23456789, 4)).toBe('1.235 s');
        });
    });

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(1024)).toBe('1.02 kB');
            expect(formatFileSize(1048576)).toBe('1.05 MB');
        });

        it('should handle edge cases', () => {
            expect(formatFileSize(0)).toBe('0 B');
            expect(formatFileSize(NaN)).toContain('NaN');
            expect(formatFileSize(Infinity)).toContain('Infinity');
        });
    });

    describe('formatFrequency', () => {
        it('should format frequency correctly', () => {
            expect(formatFrequency(1000)).toBe('1000 Hz'); // Math.js doesn't always convert to kHz
            expect(formatFrequency(1000000)).toBe('1 MHz');
            expect(formatFrequency(1)).toBe('1 Hz');
        });

        it('should handle edge cases', () => {
            expect(formatFrequency(0)).toBe('0 Hz');
            expect(formatFrequency(NaN)).toContain('NaN');
            expect(formatFrequency(Infinity)).toContain('Infinity');
        });
    });

    describe('formatVoltage', () => {
        it('should format voltage correctly', () => {
            expect(formatVoltage(1)).toBe('1 V');
            expect(formatVoltage(0.001)).toBe('1 mV');
            expect(formatVoltage(1000)).toBe('1000 V'); // Math.js doesn't always convert to kV
        });

        it('should handle edge cases', () => {
            expect(formatVoltage(0)).toBe('0 V');
            expect(formatVoltage(NaN)).toContain('NaN');
            expect(formatVoltage(Infinity)).toContain('Infinity');
        });
    });

    describe('formatWithSI', () => {
        it('should format values with units correctly', () => {
            expect(formatWithSI(1000, 'm')).toBe('1000 m'); // Math.js doesn't always convert to km
            expect(formatWithSI(0.001, 'A')).toBe('1 mA');
            expect(formatWithSI(1000000, 'Hz')).toBe('1 MHz');
        });

        it('should handle values without units', () => {
            expect(formatWithSI(1234.567)).toBe('1230'); // Math.js formats numbers with precision
            expect(formatWithSI(0.001234)).toBe('0.00123');
        });

        it('should handle edge cases', () => {
            expect(formatWithSI(0, 'V')).toBe('0 V');
            expect(formatWithSI(NaN, 'A')).toContain('NaN');
            expect(formatWithSI(Infinity, 'Hz')).toContain('Infinity');
        });

        it('should respect precision parameter', () => {
            expect(formatWithSI(1234.567, 'Hz', 2)).toBe('1.2 kHz');
            expect(formatWithSI(1234.567, 'Hz', 5)).toBe('1.2346 kHz');
        });
    });
});