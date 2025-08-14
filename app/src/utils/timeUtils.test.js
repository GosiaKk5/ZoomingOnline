/**
 * Unit tests for timeUtils.js
 * Testing zoom domain calculations and time step generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateTimeSteps, getZoomDomains, setupTimeSliders, updateZoom2SliderRange } from './timeUtils.js';
import { timeSteps, plotConfig } from '../stores/appStore.js';
import { get } from 'svelte/store';

describe('timeUtils', () => {
    beforeEach(() => {
        // Reset stores before each test
        timeSteps.set([]);
        plotConfig.set({});
    });

    describe('generateTimeSteps', () => {
        it('should generate appropriate time steps including millisecond ranges', () => {
            generateTimeSteps();
            const steps = get(timeSteps);
            
            // Should have generated steps
            expect(steps.length).toBeGreaterThan(0);
            
            // Should include millisecond steps
            const msSteps = steps.filter(step => step.label.includes('ms'));
            expect(msSteps.length).toBeGreaterThan(0);
            
            // Should include specific important values
            const oneMs = steps.find(step => step.value_us === 1000); // 1 ms = 1000 µs
            expect(oneMs).toBeDefined();
            expect(oneMs.label).toBe('1 ms');
            
            // Should include sub-millisecond steps
            const tenUs = steps.find(step => step.value_us === 10); // 10 µs
            expect(tenUs).toBeDefined();
            expect(tenUs.label).toBe('10 µs');
            
            // Should be sorted by increasing value
            for (let i = 1; i < steps.length; i++) {
                expect(steps[i].value_us).toBeGreaterThan(steps[i-1].value_us);
            }
        });

        it('should not create duplicates', () => {
            generateTimeSteps();
            const steps = get(timeSteps);
            const values = steps.map(s => s.value_us);
            const uniqueValues = [...new Set(values)];
            expect(values.length).toBe(uniqueValues.length);
        });
    });

    describe('setupTimeSliders', () => {
        beforeEach(() => {
            generateTimeSteps(); // Ensure time steps exist
        });

        it('should filter time steps correctly for 1ms total time', () => {
            const totalTimeUs = 1000; // 1 ms in microseconds
            const result = setupTimeSliders(totalTimeUs);
            
            // All valid steps should be less than total time
            result.validTimeSteps.forEach(step => {
                expect(step.value_us).toBeLessThan(totalTimeUs);
            });
            
            // Should include some reasonable zoom levels for 1ms
            const tenUs = result.validTimeSteps.find(s => s.value_us === 10);
            const hundredUs = result.validTimeSteps.find(s => s.value_us === 100);
            
            expect(tenUs).toBeDefined();
            expect(hundredUs).toBeDefined();
            
            // Should NOT include the 1ms step itself (as zoom window can't be same as total)
            const oneMs = result.validTimeSteps.find(s => s.value_us === 1000);
            expect(oneMs).toBeUndefined();
        });

        it('should handle larger time ranges', () => {
            const totalTimeUs = 10000; // 10 ms
            const result = setupTimeSliders(totalTimeUs);
            
            // Should include millisecond-level steps for larger ranges
            const oneMs = result.validTimeSteps.find(s => s.value_us === 1000);
            const fiveMs = result.validTimeSteps.find(s => s.value_us === 5000);
            
            expect(oneMs).toBeDefined();
            expect(fiveMs).toBeDefined();
        });
    });

    describe('getZoomDomains', () => {
        beforeEach(() => {
            generateTimeSteps();
            
            // Setup a realistic plot config for 1ms total time
            const totalTimeUs = 1000; // 1 ms
            setupTimeSliders(totalTimeUs);
        });

        it('should calculate zoom1 domain correctly for 1ms file', () => {
            const config = get(plotConfig);
            expect(config.total_time_us).toBe(1000);
            expect(config.validTimeSteps.length).toBeGreaterThan(0);
            
            // Use a reasonable zoom window (e.g., 100 µs = index of 100µs step)
            const hundredUsIndex = config.validTimeSteps.findIndex(s => s.value_us === 100);
            expect(hundredUsIndex).toBeGreaterThan(-1);
            
            const result = getZoomDomains(50, hundredUsIndex, 50, 0);
            
            // Zoom1 should be centered at 50% of 1000µs = 500µs
            // With 100µs window, should be 450-550µs
            expect(result.zoom1Domain[0]).toBeCloseTo(450, 1);
            expect(result.zoom1Domain[1]).toBeCloseTo(550, 1);
            
            // Domain should be valid
            expect(result.zoom1Domain[0]).toBeLessThan(result.zoom1Domain[1]);
            expect(result.zoom1Domain[0]).toBeGreaterThanOrEqual(0);
            expect(result.zoom1Domain[1]).toBeLessThanOrEqual(1000);
        });

        it('should constrain zoom2 domain within zoom1 domain', () => {
            const config = get(plotConfig);
            
            // Setup zoom1 with 500µs window at position 50%
            const fiveHundredUsIndex = config.validTimeSteps.findIndex(s => s.value_us === 500);
            const tenUsIndex = config.validTimeSteps.findIndex(s => s.value_us === 10);
            
            if (fiveHundredUsIndex === -1 || tenUsIndex === -1) {
                // Skip if specific time steps not available
                return;
            }
            
            const result = getZoomDomains(50, fiveHundredUsIndex, 50, tenUsIndex);
            
            // Zoom2 domain should be within zoom1 domain
            expect(result.zoom2Domain[0]).toBeGreaterThanOrEqual(result.zoom1Domain[0]);
            expect(result.zoom2Domain[1]).toBeLessThanOrEqual(result.zoom1Domain[1]);
            
            // Zoom2 should be smaller than zoom1
            const zoom1Width = result.zoom1Domain[1] - result.zoom1Domain[0];
            const zoom2Width = result.zoom2Domain[1] - result.zoom2Domain[0];
            expect(zoom2Width).toBeLessThan(zoom1Width);
        });

        it('should handle edge cases gracefully', () => {
            // Test with position at start (0%)
            const result1 = getZoomDomains(0, 0, 0, 0);
            expect(result1.zoom1Domain[0]).toBeGreaterThanOrEqual(0);
            
            // Test with position at end (100%)
            const result2 = getZoomDomains(100, 0, 100, 0);
            expect(result2.zoom1Domain[1]).toBeLessThanOrEqual(1000);
            
            // Test with invalid inputs
            const result3 = getZoomDomains(NaN, -1, null, undefined);
            expect(result3.zoom1Domain).toBeDefined();
            expect(result3.zoom2Domain).toBeDefined();
        });
    });

    describe('updateZoom2SliderRange', () => {
        beforeEach(() => {
            generateTimeSteps();
            setupTimeSliders(1000); // 1ms total
        });

        it('should filter zoom2 steps to be smaller than zoom1', () => {
            const config = get(plotConfig);
            
            // Find index of 100µs step for zoom1
            const hundredUsIndex = config.validTimeSteps.findIndex(s => s.value_us === 100);
            
            if (hundredUsIndex !== -1) {
                const validZoom2 = updateZoom2SliderRange(hundredUsIndex);
                
                // All zoom2 steps should be smaller than 100µs
                validZoom2.forEach(step => {
                    expect(step.value_us).toBeLessThan(100);
                });
                
                // Should include smaller steps like 10µs, 50µs
                const tenUs = validZoom2.find(s => s.value_us === 10);
                const fiftyUs = validZoom2.find(s => s.value_us === 50);
                
                expect(tenUs).toBeDefined();
                expect(fiftyUs).toBeDefined();
            }
        });
    });

    describe('Real-world scenario tests', () => {
        it('should handle 1ms segment correctly', () => {
            // This test simulates the actual scenario from the console logs
            generateTimeSteps();
            
            const totalTimeUs = 1000.0001133514332; // From the logs
            setupTimeSliders(totalTimeUs);
            
            const config = get(plotConfig);
            
            // Should have reasonable zoom levels for 1ms data
            expect(config.validTimeSteps.length).toBeGreaterThan(5);
            
            // Should include microsecond-level steps
            const tenUs = config.validTimeSteps.find(s => s.value_us === 10);
            const hundredUs = config.validTimeSteps.find(s => s.value_us === 100);
            
            expect(tenUs).toBeDefined();
            expect(hundredUs).toBeDefined();
            
            // Default zoom calculation should show meaningful windows
            const result = getZoomDomains(50, 0, 50, 0);
            
            // The zoom window should be much smaller than 1ms but larger than 1ns
            const zoom1Width = result.zoom1Domain[1] - result.zoom1Domain[0];
            expect(zoom1Width).toBeGreaterThan(0.01); // > 0.01µs (10 ns)
            expect(zoom1Width).toBeLessThan(1000); // < 1000µs (1 ms)
        });
    });
});
