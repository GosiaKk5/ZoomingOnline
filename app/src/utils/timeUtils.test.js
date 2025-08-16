/**
 * Unit tests for timeUtils.js
 * Testing basic time step generation functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateTimeSteps, formatTimeLabel } from './timeUtils.js';
import { timeSteps } from '../stores/appStore.js';
import { get } from 'svelte/store';

describe('timeUtils', () => {
    beforeEach(() => {
        // Reset the time steps store before each test
        timeSteps.set([]);
    });

    describe('generateTimeSteps', () => {
        it('should generate appropriate time steps including millisecond ranges', () => {
            generateTimeSteps();
            const steps = get(timeSteps);
            
            expect(steps.length).toBeGreaterThan(0);
            
            // Check for nanosecond steps
            const nsSteps = steps.filter(s => s.label.includes('ns'));
            expect(nsSteps.length).toBeGreaterThan(0);
            
            // Check for microsecond steps
            const usSteps = steps.filter(s => s.label.includes('µs'));
            expect(usSteps.length).toBeGreaterThan(0);
            
            // Check for millisecond steps
            const msSteps = steps.filter(s => s.label.includes('ms'));
            expect(msSteps.length).toBeGreaterThan(0);
            
            // Check sorting
            for (let i = 1; i < steps.length; i++) {
                expect(steps[i].value_us).toBeGreaterThanOrEqual(steps[i-1].value_us);
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

    describe('formatTimeLabel', () => {
        it('should format time values correctly', () => {
            expect(formatTimeLabel(0.001)).toBe('1 ns');
            expect(formatTimeLabel(1)).toBe('1 µs');
            expect(formatTimeLabel(1000)).toBe('1 ms');
        });
    });
});
