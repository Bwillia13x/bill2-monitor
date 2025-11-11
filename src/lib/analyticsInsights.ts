// Automated insights generator for analytics data
// Analyzes funnel drop-offs, A/B test results, and engagement patterns to surface recommendations

import type { FunnelDropoff, ABTestConversionRate, HeatmapEngagementCohort } from '@/types/analytics';

export interface Insight {
    id: string;
    type: 'critical' | 'warning' | 'success' | 'info';
    category: 'funnel' | 'ab-test' | 'engagement' | 'performance';
    title: string;
    description: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number; // 0-100
    data?: Record<string, unknown>;
}

/**
 * Analyze funnel drop-off data and generate insights
 */
export function analyzeFunnelDropoffs(funnelData: FunnelDropoff[], funnelName: string): Insight[] {
    const insights: Insight[] = [];

    // Find the step with highest drop-off rate
    const sortedByDropoff = [...funnelData].sort((a, b) => b.drop_off_rate - a.drop_off_rate);
    const highestDropoff = sortedByDropoff[0];

    if (highestDropoff && highestDropoff.drop_off_rate > 30) {
        insights.push({
            id: `funnel-${funnelName}-high-dropoff`,
            type: 'critical',
            category: 'funnel',
            title: `Critical Drop-Off at "${highestDropoff.step_name}"`,
            description: `${highestDropoff.drop_off_rate.toFixed(1)}% of users abandon the ${funnelName} funnel at the "${highestDropoff.step_name}" step.`,
            recommendation: `Investigate UX friction at "${highestDropoff.step_name}". Consider A/B testing simplified versions or adding progress indicators.`,
            impact: 'high',
            confidence: 90,
            data: {
                stepName: highestDropoff.step_name,
                dropOffRate: highestDropoff.drop_off_rate,
                usersLost: highestDropoff.drop_off_count,
            },
        });
    }

    // Identify sequential drop-offs (multiple steps with increasing drop-off)
    for (let i = 1; i < funnelData.length; i++) {
        const prev = funnelData[i - 1];
        const current = funnelData[i];

        if (current.drop_off_rate > prev.drop_off_rate && current.drop_off_rate > 20) {
            insights.push({
                id: `funnel-${funnelName}-sequential-${current.step_name}`,
                type: 'warning',
                category: 'funnel',
                title: `Increasing Drop-Off at "${current.step_name}"`,
                description: `Drop-off rate increases from ${prev.drop_off_rate.toFixed(1)}% to ${current.drop_off_rate.toFixed(1)}% at "${current.step_name}".`,
                recommendation: `The funnel complexity may be overwhelming users. Consider breaking "${current.step_name}" into smaller steps or adding contextual help.`,
                impact: 'medium',
                confidence: 75,
                data: {
                    stepName: current.step_name,
                    previousDropOff: prev.drop_off_rate,
                    currentDropOff: current.drop_off_rate,
                },
            });
        }
    }

    // Find steps with unusually long completion times
    funnelData.forEach(step => {
        if (step.avg_time_in_step) {
            // Parse PostgreSQL interval to seconds
            const timeMatch = step.avg_time_in_step.match(/(\d+):(\d+):(\d+)/);
            if (timeMatch) {
                const [, hours, minutes, seconds] = timeMatch;
                const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);

                // Flag if users spend more than 2 minutes on a single step
                if (totalSeconds > 120) {
                    insights.push({
                        id: `funnel-${funnelName}-slow-${step.step_name}`,
                        type: 'warning',
                        category: 'funnel',
                        title: `Users Spend Too Long at "${step.step_name}"`,
                        description: `Average time at "${step.step_name}" is ${step.avg_time_in_step}, suggesting confusion or friction.`,
                        recommendation: `Simplify "${step.step_name}" or add inline help/examples to reduce decision time.`,
                        impact: 'medium',
                        confidence: 70,
                        data: {
                            stepName: step.step_name,
                            avgTime: step.avg_time_in_step,
                            totalSeconds,
                        },
                    });
                }
            }
        }
    });

    // Success insight if funnel performs well
    const avgDropoff = funnelData.reduce((sum, s) => sum + s.drop_off_rate, 0) / funnelData.length;
    if (avgDropoff < 15) {
        insights.push({
            id: `funnel-${funnelName}-performing-well`,
            type: 'success',
            category: 'funnel',
            title: `${funnelName} Funnel Performing Well`,
            description: `Average drop-off rate is only ${avgDropoff.toFixed(1)}%, indicating a smooth user experience.`,
            recommendation: `Current funnel design is effective. Consider using this as a template for other funnels.`,
            impact: 'low',
            confidence: 85,
            data: { avgDropoff },
        });
    }

    return insights;
}

/**
 * Analyze A/B test results and generate insights
 */
export function analyzeABTestResults(
    flagName: string,
    variants: ABTestConversionRate[],
    pValue: number,
    uplift: number
): Insight[] {
    const insights: Insight[] = [];

    if (variants.length < 2) return insights;

    const totalExposures = variants.reduce((sum, v) => sum + v.exposures, 0);
    const minSampleSize = 100;

    // Check sample size adequacy
    if (totalExposures < minSampleSize * 2) {
        insights.push({
            id: `ab-test-${flagName}-low-sample`,
            type: 'warning',
            category: 'ab-test',
            title: `${flagName}: Insufficient Sample Size`,
            description: `Only ${totalExposures} total exposures. Need at least ${minSampleSize * 2} for reliable results.`,
            recommendation: `Continue running this test. Current results may change significantly with more data.`,
            impact: 'high',
            confidence: 95,
            data: {
                totalExposures,
                needed: minSampleSize * 2 - totalExposures,
            },
        });
    }

    // Significant winner detected
    if (pValue < 0.05 && Math.abs(uplift) > 5) {
        const winner = uplift > 0 ? variants[1] : variants[0];
        insights.push({
            id: `ab-test-${flagName}-winner`,
            type: 'success',
            category: 'ab-test',
            title: `${flagName}: Clear Winner Detected`,
            description: `"${winner.variant}" shows ${Math.abs(uplift).toFixed(1)}% ${uplift > 0 ? 'improvement' : 'decline'} with p=${pValue.toFixed(4)}.`,
            recommendation: `Ship "${winner.variant}" to 100% of users. This change is statistically significant.`,
            impact: 'high',
            confidence: pValue < 0.01 ? 99 : 95,
            data: {
                winner: winner.variant,
                uplift,
                pValue,
            },
        });
    }

    // No significant difference
    if (pValue >= 0.10 && totalExposures >= minSampleSize * 2) {
        insights.push({
            id: `ab-test-${flagName}-no-diff`,
            type: 'info',
            category: 'ab-test',
            title: `${flagName}: No Significant Difference`,
            description: `After ${totalExposures} exposures, variants perform similarly (p=${pValue.toFixed(4)}).`,
            recommendation: `Consider stopping this test. Either variant can be shipped, or test more radical changes.`,
            impact: 'medium',
            confidence: 80,
            data: {
                pValue,
                totalExposures,
            },
        });
    }

    // Marginally significant - need more data
    if (pValue >= 0.05 && pValue < 0.10) {
        insights.push({
            id: `ab-test-${flagName}-marginal`,
            type: 'warning',
            category: 'ab-test',
            title: `${flagName}: Marginally Significant Results`,
            description: `Results show weak evidence of difference (p=${pValue.toFixed(4)}). More data needed for confidence.`,
            recommendation: `Continue test for 1-2 more weeks to reach statistical significance threshold.`,
            impact: 'medium',
            confidence: 70,
            data: {
                pValue,
                uplift,
            },
        });
    }

    // Negative results warning
    if (pValue < 0.05 && uplift < -10) {
        insights.push({
            id: `ab-test-${flagName}-negative`,
            type: 'critical',
            category: 'ab-test',
            title: `${flagName}: Significant Negative Impact`,
            description: `Variant shows ${Math.abs(uplift).toFixed(1)}% decline in conversion rate.`,
            recommendation: `Stop this test immediately and ship the control variant. Consider reverting changes.`,
            impact: 'high',
            confidence: 95,
            data: {
                uplift,
                pValue,
            },
        });
    }

    return insights;
}

/**
 * Analyze engagement cohorts and generate insights
 */
export function analyzeEngagementCohorts(cohorts: HeatmapEngagementCohort[]): Insight[] {
    const insights: Insight[] = [];

    const highEngagement = cohorts.find(c => c.engagement_level === 'high');
    const lowEngagement = cohorts.find(c => c.engagement_level === 'low');

    if (!highEngagement || !lowEngagement) return insights;

    // High engagement → high conversion correlation
    if (highEngagement.conversion_to_signal_rate > lowEngagement.conversion_to_signal_rate * 2) {
        insights.push({
            id: 'engagement-conversion-correlation',
            type: 'success',
            category: 'engagement',
            title: 'Strong Engagement-Conversion Correlation',
            description: `Highly engaged users convert at ${highEngagement.conversion_to_signal_rate.toFixed(1)}% vs ${lowEngagement.conversion_to_signal_rate.toFixed(1)}% for low engagement.`,
            recommendation: `Focus on increasing heatmap interactions. Consider adding tooltips, animations, or gamification to boost engagement.`,
            impact: 'high',
            confidence: 90,
            data: {
                highConversion: highEngagement.conversion_to_signal_rate,
                lowConversion: lowEngagement.conversion_to_signal_rate,
                ratio: highEngagement.conversion_to_signal_rate / lowEngagement.conversion_to_signal_rate,
            },
        });
    }

    // Many users in low engagement cohort
    const totalUsers = cohorts.reduce((sum, c) => sum + c.user_count, 0);
    const lowEngagementPct = (lowEngagement.user_count / totalUsers) * 100;

    if (lowEngagementPct > 60) {
        insights.push({
            id: 'engagement-low-majority',
            type: 'warning',
            category: 'engagement',
            title: 'Majority of Users Have Low Engagement',
            description: `${lowEngagementPct.toFixed(1)}% of users interact minimally with the heatmap.`,
            recommendation: `Improve discoverability of heatmap interactions. Add a brief tutorial or highlight interactive elements.`,
            impact: 'high',
            confidence: 85,
            data: {
                lowEngagementPct,
                lowEngagementCount: lowEngagement.user_count,
                totalUsers,
            },
        });
    }

    // Time on map insights
    const parseTime = (timeStr: string): number => {
        const match = timeStr.match(/(\d+):(\d+):(\d+)/);
        if (!match) return 0;
        const [, hours, minutes, seconds] = match;
        return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
    };

    const highTime = parseTime(highEngagement.avg_time_on_map);
    const lowTime = parseTime(lowEngagement.avg_time_on_map);

    if (highTime > 120 && lowTime < 30) {
        insights.push({
            id: 'engagement-time-disparity',
            type: 'info',
            category: 'engagement',
            title: 'Large Time-on-Map Disparity',
            description: `High engagement users spend ${Math.round(highTime)}s vs ${Math.round(lowTime)}s for low engagement.`,
            recommendation: `Consider creating a "quick view" mode for users who want instant insights without deep exploration.`,
            impact: 'medium',
            confidence: 75,
            data: {
                highTime,
                lowTime,
                ratio: highTime / lowTime,
            },
        });
    }

    return insights;
}

/**
 * Generate all insights from analytics data
 */
export interface AnalyticsInsightsInput {
    funnels?: { name: string; data: FunnelDropoff[] }[];
    abTests?: {
        flagName: string;
        variants: ABTestConversionRate[];
        pValue: number;
        uplift: number;
    }[];
    engagementCohorts?: HeatmapEngagementCohort[];
}

export function generateInsights(input: AnalyticsInsightsInput): Insight[] {
    const allInsights: Insight[] = [];

    // Funnel insights
    if (input.funnels) {
        input.funnels.forEach(funnel => {
            allInsights.push(...analyzeFunnelDropoffs(funnel.data, funnel.name));
        });
    }

    // A/B test insights
    if (input.abTests) {
        input.abTests.forEach(test => {
            allInsights.push(...analyzeABTestResults(test.flagName, test.variants, test.pValue, test.uplift));
        });
    }

    // Engagement insights
    if (input.engagementCohorts) {
        allInsights.push(...analyzeEngagementCohorts(input.engagementCohorts));
    }

    // Sort by impact and confidence
    return allInsights.sort((a, b) => {
        const impactScore = (i: Insight) => {
            const impactWeight = i.impact === 'high' ? 3 : i.impact === 'medium' ? 2 : 1;
            const typeWeight = i.type === 'critical' ? 4 : i.type === 'warning' ? 3 : i.type === 'success' ? 2 : 1;
            return impactWeight * typeWeight * (i.confidence / 100);
        };
        return impactScore(b) - impactScore(a);
    });
}
