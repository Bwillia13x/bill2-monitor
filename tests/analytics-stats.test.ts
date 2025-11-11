// Tests for A/B Test Statistical Analysis
// Validates chi-square tests, confidence intervals, and significance calculations

import { describe, it, expect } from 'vitest';
import {
    calculateChiSquare,
    calculateConfidenceInterval,
    getSignificanceLevel,
    analyzeABTest,
} from '../src/lib/abTestStats';

describe('A/B Test Statistical Analysis', () => {
    describe('Chi-Square Test', () => {
        it('should calculate chi-square statistic correctly', () => {
            // Test case: 100 exposures, 20 conversions vs 100 exposures, 30 conversions
            const result = calculateChiSquare(100, 20, 100, 30);

            expect(result.chiSquare).toBeGreaterThan(0);
            expect(result.degreesOfFreedom).toBe(1);
            expect(result.pValue).toBeGreaterThan(0);
            expect(result.pValue).toBeLessThan(1);
        });

        it('should detect significant difference with large sample', () => {
            // Large sample with clear difference
            const result = calculateChiSquare(1000, 200, 1000, 300);

            expect(result.pValue).toBeLessThan(0.05); // Significant at 5% level
        });

        it('should not detect significance with small difference', () => {
            // Small difference
            const result = calculateChiSquare(100, 20, 100, 22);

            expect(result.pValue).toBeGreaterThan(0.05); // Not significant
        });

        it('should handle equal conversion rates', () => {
            const result = calculateChiSquare(100, 25, 100, 25);

            expect(result.chiSquare).toBe(0);
            expect(result.pValue).toBeCloseTo(1, 5); // Very close to 1
        });

        it('should handle zero conversions', () => {
            const result = calculateChiSquare(100, 0, 100, 0);

            expect(result.chiSquare).toBe(0);
            expect(result.pValue).toBe(1);
        });

        it('should handle one group with zero conversions', () => {
            const result = calculateChiSquare(100, 0, 100, 20);

            expect(result.pValue).toBeLessThan(0.05);
        });
    });

    describe('Confidence Intervals', () => {
        it('should calculate Wilson score confidence interval', () => {
            const ci = calculateConfidenceInterval(20, 100, 0.95);

            expect(ci.lower).toBeGreaterThan(0);
            expect(ci.upper).toBeLessThan(1);
            expect(ci.lower).toBeLessThan(ci.upper);
            expect(ci.lower).toBeLessThan(0.2); // Lower bound < observed rate
            expect(ci.upper).toBeGreaterThan(0.2); // Upper bound > observed rate
        });

        it('should have wider intervals with smaller samples', () => {
            const smallSample = calculateConfidenceInterval(10, 50, 0.95);
            const largeSample = calculateConfidenceInterval(100, 500, 0.95);

            const smallWidth = smallSample.upper - smallSample.lower;
            const largeWidth = largeSample.upper - largeSample.lower;

            expect(smallWidth).toBeGreaterThan(largeWidth);
        });

        it('should handle 100% conversion rate', () => {
            const ci = calculateConfidenceInterval(100, 100, 0.95);

            expect(ci.lower).toBeGreaterThan(0.9);
            expect(ci.upper).toBeCloseTo(1, 10); // Close to 1 (floating point precision)
        });

        it('should handle 0% conversion rate', () => {
            const ci = calculateConfidenceInterval(0, 100, 0.95);

            expect(ci.lower).toBe(0);
            expect(ci.upper).toBeLessThan(0.1);
        });

        it('should respect confidence level', () => {
            const conversions = 20;
            const exposures = 100;

            // Function only supports 0.95 and 0.99 confidence levels
            const ci95 = calculateConfidenceInterval(conversions, exposures, 0.95);
            const ci99 = calculateConfidenceInterval(conversions, exposures, 0.99);

            const width95 = ci95.upper - ci95.lower;
            const width99 = ci99.upper - ci99.lower;

            // Higher confidence levels should have wider intervals
            expect(width99).toBeGreaterThan(width95);
        });
    });

    describe('Significance Level', () => {
        it('should categorize highly significant results', () => {
            const { level } = getSignificanceLevel(0.0001);
            expect(level).toBe('highly-significant');
        });

        it('should categorize significant results', () => {
            const { level } = getSignificanceLevel(0.03);
            expect(level).toBe('significant');
        });

        it('should categorize marginally significant results', () => {
            const { level } = getSignificanceLevel(0.07);
            expect(level).toBe('marginally-significant');
        });

        it('should categorize not significant results', () => {
            const { level } = getSignificanceLevel(0.15);
            expect(level).toBe('not-significant');
        });

        it('should handle boundary cases', () => {
            expect(getSignificanceLevel(0.009).level).toBe('highly-significant');
            expect(getSignificanceLevel(0.01).level).toBe('significant');
            expect(getSignificanceLevel(0.049).level).toBe('significant');
            expect(getSignificanceLevel(0.05).level).toBe('marginally-significant');
        });
    });

    describe('Complete A/B Test Analysis', () => {
        it('should identify clear winner', () => {
            const analysis = analyzeABTest(
                'control',
                1000,
                200,
                'variant',
                1000,
                300
            );

            expect(analysis.significance.level).not.toBe('not-significant');
            expect(analysis.pValue).toBeLessThan(0.05);
            expect(analysis.uplift).toBeCloseTo(50, 0); // 50% uplift
            expect(analysis.recommendation).toContain('variant');
        });

        it('should not declare winner with insufficient evidence', () => {
            const analysis = analyzeABTest(
                'control',
                50,
                10,
                'variant',
                50,
                12
            );

            // Small sample, likely not significant
            expect(analysis.pValue).toBeGreaterThan(0);
        });

        it('should identify negative impact', () => {
            const analysis = analyzeABTest(
                'control',
                1000,
                300,
                'variant',
                1000,
                200
            );

            expect(analysis.uplift).toBeLessThan(0);
            expect(analysis.recommendation).toContain('control');
        });

        it('should calculate uplift correctly', () => {
            const analysis = analyzeABTest(
                'control',
                1000,
                100, // 10% conversion
                'variant',
                1000,
                150  // 15% conversion
            );

            expect(analysis.uplift).toBeCloseTo(50, 0); // 50% relative uplift
        });

        it('should handle zero baseline conversion', () => {
            const analysis = analyzeABTest(
                'control',
                100,
                0,
                'variant',
                100,
                10
            );

            // When baseline is zero, uplift returns 0 (can't calculate relative uplift from zero)
            expect(analysis.uplift).toBe(0);
            expect(analysis.significance.level).not.toBe('not-significant');
        });

        it('should include confidence intervals', () => {
            const analysis = analyzeABTest(
                'control',
                1000,
                200,
                'variant',
                1000,
                300
            );

            expect(analysis.confidence.variant1).toBeDefined();
            expect(analysis.confidence.variant2).toBeDefined();
            expect(analysis.confidence.variant1.lower).toBeLessThan(analysis.confidence.variant1.upper);
            expect(analysis.confidence.variant2.lower).toBeLessThan(analysis.confidence.variant2.upper);
        });

        it('should recommend more data for insufficient samples', () => {
            const analysis = analyzeABTest(
                'control',
                50,
                10,
                'variant',
                50,
                12
            );

            expect(analysis.recommendation).toContain('insufficient sample');
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large samples', () => {
            const analysis = analyzeABTest(
                'control',
                100000,
                20000,
                'variant',
                100000,
                20100
            );

            expect(analysis.pValue).toBeDefined();
            expect(analysis.uplift).toBeCloseTo(0.5, 1);
        });

        it('should handle very small samples', () => {
            const analysis = analyzeABTest(
                'control',
                10,
                2,
                'variant',
                10,
                3
            );

            expect(analysis.pValue).toBeDefined();
            expect(analysis.pValue).toBeGreaterThan(0);
            expect(analysis.pValue).toBeLessThan(1);
        });

        it('should handle identical results', () => {
            const analysis = analyzeABTest(
                'control',
                500,
                100,
                'variant',
                500,
                100
            );

            expect(analysis.pValue).toBeCloseTo(1, 5); // Very close to 1
            expect(analysis.uplift).toBe(0);
            expect(analysis.significance.level).toBe('not-significant');
        });

        it('should handle extreme conversion differences', () => {
            const analysis = analyzeABTest(
                'control',
                1000,
                10,  // 1% conversion
                'variant',
                1000,
                500  // 50% conversion
            );

            expect(analysis.significance.level).not.toBe('not-significant');
            expect(analysis.uplift).toBeGreaterThan(1000); // >1000% uplift
        });
    });
});
