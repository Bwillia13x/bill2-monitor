import { describe, it, expect } from 'vitest';
import {
    analyzeFunnelDropoffs,
    analyzeABTestResults,
    analyzeEngagementCohorts,
    generateInsights,
    type Insight,
    type AnalyticsInsightsInput,
} from '@/lib/analyticsInsights';
import type { FunnelDropoff, ABTestConversionRate, HeatmapEngagementCohort } from '@/types/analytics';

describe('Analytics Insights Generation', () => {
    describe('Funnel Dropoff Analysis', () => {
        it('should detect critical high drop-off rates', () => {
            const funnelData: FunnelDropoff[] = [
                {
                    step_number: 1,
                    step_name: 'Landing Page',
                    entered_count: 1000,
                    completed_count: 700,
                    drop_off_count: 300,
                    drop_off_rate: 30,
                    completion_rate: 70,
                    avg_time_in_step: '00:00:30',
                },
                {
                    step_number: 2,
                    step_name: 'Form',
                    entered_count: 700,
                    completed_count: 300,
                    drop_off_count: 400,
                    drop_off_rate: 57.14,
                    completion_rate: 42.86,
                    avg_time_in_step: '00:01:00',
                },
            ];

            const insights = analyzeFunnelDropoffs(funnelData, 'Signup');

            const criticalInsight = insights.find(i => i.type === 'critical');
            expect(criticalInsight).toBeDefined();
            expect(criticalInsight?.title).toContain('Form');
            expect(criticalInsight?.impact).toBe('high');
            expect(criticalInsight?.data?.dropOffRate).toBeCloseTo(57.14, 2);
        });

        it('should identify sequential drop-off increases', () => {
            const funnelData: FunnelDropoff[] = [
                {
                    step_number: 1,
                    step_name: 'Step 1',
                    entered_count: 1000,
                    completed_count: 900,
                    drop_off_count: 100,
                    drop_off_rate: 10,
                    completion_rate: 90,
                    avg_time_in_step: '00:00:30',
                },
                {
                    step_number: 2,
                    step_name: 'Step 2',
                    entered_count: 900,
                    completed_count: 700,
                    drop_off_count: 200,
                    drop_off_rate: 22.22,
                    completion_rate: 77.78,
                    avg_time_in_step: '00:00:45',
                },
            ];

            const insights = analyzeFunnelDropoffs(funnelData, 'Test');

            const sequentialWarning = insights.find(
                i => i.type === 'warning' && i.title.includes('Increasing Drop-Off')
            );
            expect(sequentialWarning).toBeDefined();
            expect(sequentialWarning?.data?.previousDropOff).toBe(10);
            expect(sequentialWarning?.data?.currentDropOff).toBeCloseTo(22.22, 2);
        });

        it('should detect slow steps with long completion times', () => {
            const funnelData: FunnelDropoff[] = [
                {
                    step_number: 1,
                    step_name: 'Complex Form',
                    entered_count: 1000,
                    completed_count: 800,
                    drop_off_count: 200,
                    drop_off_rate: 20,
                    completion_rate: 80,
                    avg_time_in_step: '00:05:30', // 5.5 minutes
                },
            ];

            const insights = analyzeFunnelDropoffs(funnelData, 'Signup');

            const slowStepWarning = insights.find(
                i => i.type === 'warning' && i.title.includes('Too Long')
            );
            expect(slowStepWarning).toBeDefined();
            expect(slowStepWarning?.data?.totalSeconds).toBe(330);
        });

        it('should generate success insight for well-performing funnels', () => {
            const funnelData: FunnelDropoff[] = [
                {
                    step_number: 1,
                    step_name: 'Step 1',
                    entered_count: 1000,
                    completed_count: 950,
                    drop_off_count: 50,
                    drop_off_rate: 5,
                    completion_rate: 95,
                    avg_time_in_step: '00:00:20',
                },
                {
                    step_number: 2,
                    step_name: 'Step 2',
                    entered_count: 950,
                    completed_count: 900,
                    drop_off_count: 50,
                    drop_off_rate: 5.26,
                    completion_rate: 94.74,
                    avg_time_in_step: '00:00:30',
                },
            ];

            const insights = analyzeFunnelDropoffs(funnelData, 'Checkout');

            const successInsight = insights.find(i => i.type === 'success');
            expect(successInsight).toBeDefined();
            expect(successInsight?.title).toContain('Performing Well');
            expect(successInsight?.data?.avgDropoff).toBeLessThan(15);
        });

        it('should handle empty funnel data gracefully', () => {
            const insights = analyzeFunnelDropoffs([], 'Empty');
            expect(insights).toHaveLength(0);
        });
    });

    describe('A/B Test Results Analysis', () => {
        const createVariants = (
            control: { conversions: number; exposures: number },
            variant: { conversions: number; exposures: number }
        ): ABTestConversionRate[] => [
                {
                    variant: 'control',
                    conversions: control.conversions,
                    exposures: control.exposures,
                    conversion_rate: (control.conversions / control.exposures) * 100,
                },
                {
                    variant: 'treatment',
                    conversions: variant.conversions,
                    exposures: variant.exposures,
                    conversion_rate: (variant.conversions / variant.exposures) * 100,
                },
            ];

        it('should warn about insufficient sample sizes', () => {
            const variants = createVariants(
                { conversions: 10, exposures: 50 },
                { conversions: 15, exposures: 50 }
            );

            const insights = analyzeABTestResults('test-flag', variants, 0.15, 10);

            const lowSampleWarning = insights.find(
                i => i.type === 'warning' && i.title.includes('Insufficient Sample')
            );
            expect(lowSampleWarning).toBeDefined();
            expect(lowSampleWarning?.impact).toBe('high');
            expect(lowSampleWarning?.data?.totalExposures).toBe(100);
            expect(lowSampleWarning?.data?.needed).toBeGreaterThan(0);
        });

        it('should detect clear winners with significant results', () => {
            const variants = createVariants(
                { conversions: 100, exposures: 1000 },
                { conversions: 150, exposures: 1000 }
            );

            const uplift = 50; // 50% improvement
            const pValue = 0.001; // Highly significant

            const insights = analyzeABTestResults('winner-test', variants, pValue, uplift);

            const winnerInsight = insights.find(
                i => i.type === 'success' && i.title.includes('Winner')
            );
            expect(winnerInsight).toBeDefined();
            expect(winnerInsight?.impact).toBe('high');
            expect(winnerInsight?.confidence).toBeGreaterThanOrEqual(99);
            expect(winnerInsight?.data?.uplift).toBe(50);
        });

        it('should identify no significant difference', () => {
            const variants = createVariants(
                { conversions: 100, exposures: 1000 },
                { conversions: 102, exposures: 1000 }
            );

            const uplift = 2;
            const pValue = 0.75; // Not significant

            const insights = analyzeABTestResults('no-diff-test', variants, pValue, uplift);

            const noDiffInsight = insights.find(
                i => i.type === 'info' && i.title.includes('No Significant Difference')
            );
            expect(noDiffInsight).toBeDefined();
            expect(noDiffInsight?.recommendation).toContain('stopping this test');
        });

        it('should flag marginally significant results', () => {
            const variants = createVariants(
                { conversions: 100, exposures: 1000 },
                { conversions: 115, exposures: 1000 }
            );

            const uplift = 15;
            const pValue = 0.07; // Marginally significant

            const insights = analyzeABTestResults('marginal-test', variants, pValue, uplift);

            const marginalWarning = insights.find(
                i => i.type === 'warning' && i.title.includes('Marginally Significant')
            );
            expect(marginalWarning).toBeDefined();
            expect(marginalWarning?.recommendation).toContain('Continue test');
        });

        it('should alert on significant negative impact', () => {
            const variants = createVariants(
                { conversions: 200, exposures: 1000 },
                { conversions: 150, exposures: 1000 }
            );

            const uplift = -25; // 25% decline
            const pValue = 0.01; // Significant

            const insights = analyzeABTestResults('negative-test', variants, pValue, uplift);

            const negativeAlert = insights.find(
                i => i.type === 'critical' && i.title.includes('Negative Impact')
            );
            expect(negativeAlert).toBeDefined();
            expect(negativeAlert?.recommendation).toContain('Stop this test');
            expect(negativeAlert?.data?.uplift).toBe(-25);
        });

        it('should handle single variant gracefully', () => {
            const insights = analyzeABTestResults('single', [createVariants({ conversions: 10, exposures: 100 }, { conversions: 10, exposures: 100 })[0]], 0.5, 0);
            expect(insights).toHaveLength(0);
        });
    });

    describe('Engagement Cohorts Analysis', () => {
        const createCohorts = (): HeatmapEngagementCohort[] => [
            {
                engagement_level: 'low',
                user_count: 700,
                avg_time_on_map: '00:00:20',
                avg_clicks: 1,
                conversion_to_signal_rate: 5,
            },
            {
                engagement_level: 'medium',
                user_count: 200,
                avg_time_on_map: '00:01:00',
                avg_clicks: 5,
                conversion_to_signal_rate: 15,
            },
            {
                engagement_level: 'high',
                user_count: 100,
                avg_time_on_map: '00:03:00',
                avg_clicks: 15,
                conversion_to_signal_rate: 35,
            },
        ];

        it('should detect strong engagement-conversion correlation', () => {
            const cohorts = createCohorts();

            const insights = analyzeEngagementCohorts(cohorts);

            const correlationInsight = insights.find(
                i => i.type === 'success' && i.title.includes('Correlation')
            );
            expect(correlationInsight).toBeDefined();
            expect(correlationInsight?.data?.ratio).toBeGreaterThan(2);
            expect(correlationInsight?.impact).toBe('high');
        });

        it('should warn when majority have low engagement', () => {
            const cohorts = createCohorts();

            const insights = analyzeEngagementCohorts(cohorts);

            const lowMajorityWarning = insights.find(
                i => i.type === 'warning' && i.title.includes('Majority')
            );
            expect(lowMajorityWarning).toBeDefined();
            expect(lowMajorityWarning?.data?.lowEngagementPct).toBeGreaterThan(60);
        });

        it('should identify time-on-map disparity', () => {
            const cohorts = createCohorts();

            const insights = analyzeEngagementCohorts(cohorts);

            const timeDisparityInsight = insights.find(
                i => i.type === 'info' && i.title.includes('Time-on-Map Disparity')
            );
            expect(timeDisparityInsight).toBeDefined();
            expect(timeDisparityInsight?.data?.highTime).toBe(180); // 3 minutes
            expect(timeDisparityInsight?.data?.lowTime).toBe(20);
        });

        it('should handle missing engagement levels gracefully', () => {
            const incompleteCohorts: HeatmapEngagementCohort[] = [
                {
                    engagement_level: 'high',
                    user_count: 100,
                    avg_time_on_map: '00:03:00',
                    avg_clicks: 15,
                    conversion_to_signal_rate: 35,
                },
            ];

            const insights = analyzeEngagementCohorts(incompleteCohorts);
            expect(insights).toHaveLength(0);
        });
    });

    describe('Comprehensive Insights Generation', () => {
        it('should combine insights from all sources', () => {
            const input: AnalyticsInsightsInput = {
                funnels: [
                    {
                        name: 'Signup',
                        data: [
                            {
                                step_number: 1,
                                step_name: 'Form',
                                entered_count: 1000,
                                completed_count: 600,
                                drop_off_count: 400,
                                drop_off_rate: 40,
                                completion_rate: 60,
                                avg_time_in_step: '00:01:00',
                            },
                        ],
                    },
                ],
                abTests: [
                    {
                        flagName: 'new-cta',
                        variants: [
                            { variant: 'control', conversions: 100, exposures: 1000, conversion_rate: 10 },
                            { variant: 'treatment', conversions: 150, exposures: 1000, conversion_rate: 15 },
                        ],
                        pValue: 0.001,
                        uplift: 50,
                    },
                ],
                engagementCohorts: [
                    {
                        engagement_level: 'low',
                        user_count: 700,
                        avg_time_on_map: '00:00:15',
                        avg_clicks: 1,
                        conversion_to_signal_rate: 5,
                    },
                    {
                        engagement_level: 'high',
                        user_count: 300,
                        avg_time_on_map: '00:02:00',
                        avg_clicks: 10,
                        conversion_to_signal_rate: 25,
                    },
                ],
            };

            const insights = generateInsights(input);

            expect(insights.length).toBeGreaterThan(0);

            // Should have insights from each category
            const categories = new Set(insights.map(i => i.category));
            expect(categories.has('funnel')).toBe(true);
            expect(categories.has('ab-test')).toBe(true);
            expect(categories.has('engagement')).toBe(true);
        });

        it('should sort insights by impact and confidence', () => {
            const input: AnalyticsInsightsInput = {
                funnels: [
                    {
                        name: 'Test',
                        data: [
                            {
                                step_number: 1,
                                step_name: 'Critical Step',
                                entered_count: 1000,
                                completed_count: 500,
                                drop_off_count: 500,
                                drop_off_rate: 50,
                                completion_rate: 50,
                                avg_time_in_step: '00:01:00',
                            },
                        ],
                    },
                ],
            };

            const insights = generateInsights(input);

            // Critical insights should be prioritized
            const firstInsight = insights[0];
            expect(firstInsight.type).toBe('critical');
            expect(firstInsight.impact).toBe('high');
        });

        it('should handle empty input gracefully', () => {
            const insights = generateInsights({});
            expect(insights).toHaveLength(0);
        });

        it('should handle partial input', () => {
            const input: AnalyticsInsightsInput = {
                abTests: [
                    {
                        flagName: 'test',
                        variants: [
                            { variant: 'control', conversions: 10, exposures: 50, conversion_rate: 20 },
                            { variant: 'treatment', conversions: 12, exposures: 50, conversion_rate: 24 },
                        ],
                        pValue: 0.5,
                        uplift: 20,
                    },
                ],
            };

            const insights = generateInsights(input);
            expect(insights.length).toBeGreaterThan(0);
            expect(insights.every(i => i.category === 'ab-test')).toBe(true);
        });
    });

    describe('Insight Structure Validation', () => {
        it('should generate valid insight objects', () => {
            const funnelData: FunnelDropoff[] = [
                {
                    step_number: 1,
                    step_name: 'Test',
                    entered_count: 100,
                    completed_count: 50,
                    drop_off_count: 50,
                    drop_off_rate: 50,
                    completion_rate: 50,
                    avg_time_in_step: '00:01:00',
                },
            ];

            const insights = analyzeFunnelDropoffs(funnelData, 'Test');

            insights.forEach(insight => {
                expect(insight).toHaveProperty('id');
                expect(insight).toHaveProperty('type');
                expect(insight).toHaveProperty('category');
                expect(insight).toHaveProperty('title');
                expect(insight).toHaveProperty('description');
                expect(insight).toHaveProperty('recommendation');
                expect(insight).toHaveProperty('impact');
                expect(insight).toHaveProperty('confidence');

                expect(['critical', 'warning', 'success', 'info']).toContain(insight.type);
                expect(['funnel', 'ab-test', 'engagement', 'performance']).toContain(insight.category);
                expect(['high', 'medium', 'low']).toContain(insight.impact);
                expect(insight.confidence).toBeGreaterThanOrEqual(0);
                expect(insight.confidence).toBeLessThanOrEqual(100);
            });
        });
    });
});
