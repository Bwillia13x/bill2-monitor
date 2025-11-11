// Statistical significance utilities for A/B testing
// Implements chi-square test, confidence intervals, and p-value calculations

/**
 * Calculate chi-square statistic for A/B test
 * Tests if observed conversion rates differ significantly from expected
 */
export function calculateChiSquare(
    variant1Exposures: number,
    variant1Conversions: number,
    variant2Exposures: number,
    variant2Conversions: number
): { chiSquare: number; pValue: number; degreesOfFreedom: number } {
    const totalExposures = variant1Exposures + variant2Exposures;
    const totalConversions = variant1Conversions + variant2Conversions;

    if (totalExposures === 0 || totalConversions === 0) {
        return { chiSquare: 0, pValue: 1, degreesOfFreedom: 1 };
    }

    // Expected conversions under null hypothesis (no difference)
    const expectedV1Conversions = (variant1Exposures * totalConversions) / totalExposures;
    const expectedV2Conversions = (variant2Exposures * totalConversions) / totalExposures;
    const expectedV1NonConversions = variant1Exposures - expectedV1Conversions;
    const expectedV2NonConversions = variant2Exposures - expectedV2Conversions;

    // Observed values
    const observedV1Conversions = variant1Conversions;
    const observedV2Conversions = variant2Conversions;
    const observedV1NonConversions = variant1Exposures - variant1Conversions;
    const observedV2NonConversions = variant2Exposures - variant2Conversions;

    // Chi-square statistic
    const chiSquare =
        Math.pow(observedV1Conversions - expectedV1Conversions, 2) / expectedV1Conversions +
        Math.pow(observedV2Conversions - expectedV2Conversions, 2) / expectedV2Conversions +
        Math.pow(observedV1NonConversions - expectedV1NonConversions, 2) / expectedV1NonConversions +
        Math.pow(observedV2NonConversions - expectedV2NonConversions, 2) / expectedV2NonConversions;

    // Degrees of freedom for 2x2 contingency table
    const degreesOfFreedom = 1;

    // Calculate p-value using chi-square distribution approximation
    const pValue = chiSquareToPValue(chiSquare, degreesOfFreedom);

    return { chiSquare, pValue, degreesOfFreedom };
}

/**
 * Approximate p-value from chi-square statistic (df = 1)
 * Uses error function approximation for chi-square distribution
 */
function chiSquareToPValue(chiSquare: number, df: number): number {
    if (df !== 1) {
        // For simplicity, only support df=1 (2x2 tables)
        throw new Error('Only df=1 supported');
    }

    // For df=1, chi-square distribution is related to standard normal
    // P(X^2 > x) ≈ 2 * P(Z > sqrt(x))
    const z = Math.sqrt(chiSquare);
    const pValue = 2 * (1 - normalCDF(z));

    return Math.max(0, Math.min(1, pValue));
}

/**
 * Standard normal cumulative distribution function
 * Approximation using error function
 */
function normalCDF(x: number): number {
    // Using error function approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x >= 0 ? 1 - p : p;
}

/**
 * Calculate confidence interval for conversion rate
 * Uses Wilson score interval (more accurate for small samples)
 */
export function calculateConfidenceInterval(
    conversions: number,
    exposures: number,
    confidenceLevel: number = 0.95
): { lower: number; upper: number; margin: number } {
    if (exposures === 0) {
        return { lower: 0, upper: 0, margin: 0 };
    }

    const p = conversions / exposures;

    // Z-score for confidence level (95% = 1.96, 99% = 2.576)
    const z = confidenceLevel === 0.99 ? 2.576 : 1.96;

    // Wilson score interval
    const denominator = 1 + (z * z) / exposures;
    const centerAdjustment = p + (z * z) / (2 * exposures);
    const marginFactor = z * Math.sqrt((p * (1 - p) / exposures) + (z * z) / (4 * exposures * exposures));

    const lower = (centerAdjustment - marginFactor) / denominator;
    const upper = (centerAdjustment + marginFactor) / denominator;
    const margin = (upper - lower) / 2;

    return {
        lower: Math.max(0, lower),
        upper: Math.min(1, upper),
        margin,
    };
}

/**
 * Determine statistical significance level
 */
export function getSignificanceLevel(pValue: number): {
    level: 'highly-significant' | 'significant' | 'marginally-significant' | 'not-significant';
    label: string;
    description: string;
} {
    if (pValue < 0.01) {
        return {
            level: 'highly-significant',
            label: 'Highly Significant',
            description: 'Very strong evidence of difference (p < 0.01)',
        };
    } else if (pValue < 0.05) {
        return {
            level: 'significant',
            label: 'Significant',
            description: 'Strong evidence of difference (p < 0.05)',
        };
    } else if (pValue < 0.10) {
        return {
            level: 'marginally-significant',
            label: 'Marginally Significant',
            description: 'Weak evidence of difference (p < 0.10)',
        };
    } else {
        return {
            level: 'not-significant',
            label: 'Not Significant',
            description: 'Insufficient evidence of difference (p ≥ 0.10)',
        };
    }
}

/**
 * Calculate minimum detectable effect (MDE)
 * Helps determine if sample size is sufficient
 */
export function calculateMinimumDetectableEffect(
    baselineConversionRate: number,
    totalSampleSize: number,
    alpha: number = 0.05,
    power: number = 0.80
): number {
    // Simplified MDE calculation
    // MDE = (Z_alpha/2 + Z_power) * sqrt(2 * p * (1-p) / n)
    const zAlpha = 1.96; // for alpha = 0.05
    const zPower = 0.84; // for power = 0.80

    const p = baselineConversionRate;
    const n = totalSampleSize / 2; // per variant

    const mde = (zAlpha + zPower) * Math.sqrt((2 * p * (1 - p)) / n);

    return mde;
}

/**
 * Check if sample size is sufficient for reliable results
 */
export function checkSampleSizeAdequacy(
    exposures: number,
    conversions: number
): { adequate: boolean; recommendation: string } {
    const minExposures = 100;
    const minConversions = 10;

    if (exposures < minExposures) {
        return {
            adequate: false,
            recommendation: `Need ${minExposures - exposures} more exposures for reliable results`,
        };
    }

    if (conversions < minConversions) {
        return {
            adequate: false,
            recommendation: `Need ${minConversions - conversions} more conversions for reliable results`,
        };
    }

    return {
        adequate: true,
        recommendation: 'Sample size is adequate for analysis',
    };
}

/**
 * Calculate relative uplift between variants
 */
export function calculateRelativeUplift(
    baselineRate: number,
    variantRate: number
): number {
    if (baselineRate === 0) return 0;
    return ((variantRate - baselineRate) / baselineRate) * 100;
}

/**
 * Comprehensive A/B test analysis
 */
export interface ABTestAnalysis {
    chiSquare: number;
    pValue: number;
    significance: ReturnType<typeof getSignificanceLevel>;
    winner: string | null;
    uplift: number;
    confidence: {
        variant1: ReturnType<typeof calculateConfidenceInterval>;
        variant2: ReturnType<typeof calculateConfidenceInterval>;
    };
    sampleSize: {
        variant1: ReturnType<typeof checkSampleSizeAdequacy>;
        variant2: ReturnType<typeof checkSampleSizeAdequacy>;
    };
    recommendation: string;
}

export function analyzeABTest(
    variant1Name: string,
    variant1Exposures: number,
    variant1Conversions: number,
    variant2Name: string,
    variant2Exposures: number,
    variant2Conversions: number
): ABTestAnalysis {
    const { chiSquare, pValue } = calculateChiSquare(
        variant1Exposures,
        variant1Conversions,
        variant2Exposures,
        variant2Conversions
    );

    const significance = getSignificanceLevel(pValue);

    const v1Rate = variant1Exposures > 0 ? variant1Conversions / variant1Exposures : 0;
    const v2Rate = variant2Exposures > 0 ? variant2Conversions / variant2Exposures : 0;

    const winner = v2Rate > v1Rate ? variant2Name : v1Rate > v2Rate ? variant1Name : null;
    const uplift = calculateRelativeUplift(
        v1Rate,
        v2Rate
    );

    const confidence = {
        variant1: calculateConfidenceInterval(variant1Conversions, variant1Exposures),
        variant2: calculateConfidenceInterval(variant2Conversions, variant2Exposures),
    };

    const sampleSize = {
        variant1: checkSampleSizeAdequacy(variant1Exposures, variant1Conversions),
        variant2: checkSampleSizeAdequacy(variant2Exposures, variant2Conversions),
    };

    let recommendation = '';
    if (!sampleSize.variant1.adequate || !sampleSize.variant2.adequate) {
        recommendation = 'Continue test - insufficient sample size';
    } else if (significance.level === 'highly-significant' || significance.level === 'significant') {
        recommendation = `Ship ${winner} - statistically significant winner`;
    } else if (significance.level === 'marginally-significant') {
        recommendation = 'Consider running test longer for conclusive results';
    } else {
        recommendation = 'No clear winner - variants perform similarly';
    }

    return {
        chiSquare,
        pValue,
        significance,
        winner,
        uplift,
        confidence,
        sampleSize,
        recommendation,
    };
}
