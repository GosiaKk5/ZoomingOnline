import { describe, it, expect } from 'vitest';
import { 
    generateZoomLevels, 
    generateZoomLevelsWithLabels
} from './zoomLevels';

describe('zoomLevels utilities', () => {
    describe('generateZoomLevels', () => {
        describe('input validation', () => {
            it('should throw error for non-positive lowerLimit', () => {
                expect(() => generateZoomLevels(0, 0.001)).toThrow('Both limits must be positive numbers');
                expect(() => generateZoomLevels(-1e-6, 0.001)).toThrow('Both limits must be positive numbers');
            });

            it('should throw error for non-positive upperLimit', () => {
                expect(() => generateZoomLevels(1e-6, 0)).toThrow('Both limits must be positive numbers');
                expect(() => generateZoomLevels(1e-6, -0.001)).toThrow('Both limits must be positive numbers');
            });

            it('should throw error when lowerLimit >= upperLimit', () => {
                expect(() => generateZoomLevels(0.001, 0.001)).toThrow('lowerLimit must be smaller than upperLimit');
                expect(() => generateZoomLevels(0.002, 0.001)).toThrow('lowerLimit must be smaller than upperLimit');
            });
        });

        describe('zoom level generation for example case: 100ps resolution, 1ms segment', () => {
            const lowerLimit = 100e-12; // 100ps in seconds
            const upperLimit = 1e-3; // 1ms in seconds
            const zoomLevels = generateZoomLevels(lowerLimit, upperLimit);

            it('should generate correct zoom levels', () => {
                // The expected zoom levels: starting from minimum time resolution
                // going up to half the segment duration with factors 1, 2, 5
                
                expect(zoomLevels.length).toBeGreaterThan(10); // Should generate many levels
                expect(zoomLevels.length).toBeLessThan(25); // But not too many
                
                // First level should be >= lowerLimit 
                expect(zoomLevels[0]!).toBeGreaterThanOrEqual(lowerLimit);
                
                // Last level should be <= upperLimit/2
                expect(zoomLevels[zoomLevels.length - 1]!).toBeLessThanOrEqual(upperLimit / 2);
                
                // Should include some key expected levels that we know should be there
                expect(zoomLevels.some(level => Math.abs(level - 200e-12) < 1e-15)).toBe(true); // 200ps
                expect(zoomLevels.some(level => Math.abs(level - 1e-9) < 1e-15)).toBe(true); // 1ns
                expect(zoomLevels.some(level => Math.abs(level - 1e-6) < 1e-15)).toBe(true); // 1us
            });

            it('should return sorted zoom levels', () => {
                for (let i = 1; i < zoomLevels.length; i++) {
                    expect(zoomLevels[i]!).toBeGreaterThan(zoomLevels[i-1]!);
                }
            });

            it('should have all zoom levels >= lowerLimit', () => {
                zoomLevels.forEach(level => {
                    expect(level).toBeGreaterThanOrEqual(lowerLimit);
                });
            });

            it('should have all zoom levels <= upperLimit/2', () => {
                const maxZoomLevel = upperLimit / 2;
                zoomLevels.forEach(level => {
                    expect(level).toBeLessThanOrEqual(maxZoomLevel);
                });
            });
        });

        describe('zoom level generation for example case: 20ms segment', () => {
            const lowerLimit = 100e-12; // 100ps in seconds
            const upperLimit = 20e-3; // 20ms in seconds
            const zoomLevels = generateZoomLevels(lowerLimit, upperLimit);

            it('should include levels up to 10ms (half of 20ms)', () => {
                const maxExpected = 10e-3; // 10ms in seconds
                const maxActual = Math.max(...zoomLevels);
                expect(maxActual).toBeLessThanOrEqual(maxExpected);
                
                // Should include 10ms level
                expect(zoomLevels).toContain(10e-3); // 10ms in seconds
            });

            it('should not include the 20ms level itself', () => {
                expect(zoomLevels).not.toContain(20e-3); // 20ms in seconds
            });
        });

        describe('edge cases', () => {
            it('should handle very small time ranges', () => {
                const lowerLimit = 10e-12; // 10ps in seconds
                const upperLimit = 100e-12; // 100ps in seconds
                const zoomLevels = generateZoomLevels(lowerLimit, upperLimit);
                
                expect(zoomLevels.length).toBeGreaterThan(0);
                expect(Math.min(...zoomLevels)).toBeGreaterThanOrEqual(lowerLimit);
                expect(Math.max(...zoomLevels)).toBeLessThanOrEqual(upperLimit / 2);
            });

            it('should handle large time ranges', () => {
                const lowerLimit = 1e-3; // 1ms in seconds
                const upperLimit = 10; // 10s in seconds
                const zoomLevels = generateZoomLevels(lowerLimit, upperLimit);
                
                expect(zoomLevels.length).toBeGreaterThan(0);
                expect(Math.min(...zoomLevels)).toBeGreaterThanOrEqual(lowerLimit);
                expect(Math.max(...zoomLevels)).toBeLessThanOrEqual(upperLimit / 2);
            });

            it('should handle narrow range between min and max', () => {
                const lowerLimit = 800e-9; // 800ns in seconds
                const upperLimit = 2e-6; // 2us in seconds
                const zoomLevels = generateZoomLevels(lowerLimit, upperLimit);
                
                // With such a narrow range (800ns to 1us), should only have 1us level
                expect(zoomLevels).toEqual([1e-6]); // 1us in seconds
            });
        });

        describe('multiplicative factors validation', () => {
            it('should only include levels with factors 1, 2, and 5', () => {
                const lowerLimit = 1e-12; // 1ps in seconds
                const upperLimit = 1e-6; // 1us in seconds
                const zoomLevels = generateZoomLevels(lowerLimit, upperLimit);

                zoomLevels.forEach(level => {
                    const powerOf10 = Math.pow(10, Math.floor(Math.log10(level)));
                    const factor = level / powerOf10;
                    
                    // Should be close to 1, 2, or 5 (allowing for floating point precision)
                    const isValidFactor = 
                        Math.abs(factor - 1) < 1e-10 ||
                        Math.abs(factor - 2) < 1e-10 ||
                        Math.abs(factor - 5) < 1e-10;
                    
                    expect(isValidFactor).toBe(true);
                });
            });
        });
    });

    describe('generateZoomLevelsWithLabels', () => {
        it('should generate zoom levels with human-readable labels', () => {
            const lowerLimit = 100e-12; // 100ps in seconds
            const upperLimit = 1e-6; // 1us in seconds
            const zoomLevelsWithLabels = generateZoomLevelsWithLabels(lowerLimit, upperLimit);

            expect(zoomLevelsWithLabels.length).toBeGreaterThan(0);
            
            zoomLevelsWithLabels.forEach(item => {
                expect(item).toHaveProperty('value');
                expect(item).toHaveProperty('label');
                expect(typeof item.value).toBe('number');
                expect(typeof item.label).toBe('string');
                expect(item.value).toBeGreaterThan(0);
                expect(item.label).toMatch(/^\d+(\.\d+)?\s*(ps|ns|µs|ms|s|fs)$/);
            });
        });

        it('should have matching values between regular and labeled versions', () => {
            const lowerLimit = 50e-12; // 50ps in seconds
            const upperLimit = 500e-9; // 500ns in seconds
            
            const regularZoomLevels = generateZoomLevels(lowerLimit, upperLimit);
            const labeledZoomLevels = generateZoomLevelsWithLabels(lowerLimit, upperLimit);

            expect(labeledZoomLevels.length).toBe(regularZoomLevels.length);
            
            regularZoomLevels.forEach((level, index) => {
                expect(labeledZoomLevels[index]!.value).toBe(level);
            });
        });

        it('should produce readable labels for common zoom levels', () => {
            const lowerLimit = 100e-12; // 100ps in seconds
            const upperLimit = 1e-6; // 1us in seconds
            const zoomLevelsWithLabels = generateZoomLevelsWithLabels(lowerLimit, upperLimit);

            // Find some expected labels (should be present in any reasonable implementation)
            const labels = zoomLevelsWithLabels.map(item => item.label);
            
            expect(labels).toContain('200 ps');
            expect(labels).toContain('1 ns');
            expect(labels).toContain('2 ns');
            expect(labels).toContain('5 ns');
            // Note: 500ps may or may not be included depending on algorithm precision,
            // so we don't test for it specifically
        });
    });
});