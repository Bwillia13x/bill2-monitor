import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, BarChart3, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { FeatureFlag, ABTestConversionRate, VariantConfig } from '@/types/analytics';
import { analyzeABTest } from '@/lib/abTestStats';
import { AnalyticsInsightsPanel } from './AnalyticsInsightsPanel';

export function FeatureFlagDashboard() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [conversionData, setConversionData] = useState<Map<string, ABTestConversionRate[]>>(new Map());

    const loadConversionRates = useCallback(async (flagKey: string) => {
        try {
            const { data, error } = await supabase.rpc('get_ab_test_conversion_rates', {
                p_flag_key: flagKey,
                p_conversion_event: 'signal_submitted', // Default conversion event
            });

            if (error) throw error;

            setConversionData(prev => new Map(prev).set(flagKey, data || []));
        } catch (error) {
            console.error(`Failed to load conversion rates for ${flagKey}:`, error);
        }
    }, []);

    const loadFeatureFlags = useCallback(async () => {
        try {
            setLoading(true);

            // Load feature flags
            const { data: flagsData, error: flagsError } = await supabase
                .from('feature_flags' as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (flagsError) throw flagsError;
            setFlags(flagsData || []);

            // Load conversion data for each flag
            for (const flag of flagsData || []) {
                await loadConversionRates(flag.flag_key);
            }
        } catch (error) {
            console.error('Failed to load feature flags:', error);
        } finally {
            setLoading(false);
        }
    }, [loadConversionRates]);

    useEffect(() => {
        loadFeatureFlags();
    }, [loadFeatureFlags]);

    const toggleFlag = async (flagId: string, currentState: boolean) => {
        try {
            setUpdating(flagId);

            const { error } = await supabase
                .from('feature_flags' as any)
                .update({ enabled: !currentState, updated_at: new Date().toISOString() })
                .eq('id', flagId);

            if (error) throw error;

            // Update local state
            setFlags(prev =>
                prev.map(flag =>
                    flag.id === flagId ? { ...flag, enabled: !currentState } : flag
                )
            );
        } catch (error) {
            console.error('Failed to toggle flag:', error);
        } finally {
            setUpdating(null);
        }
    };

    const updateRolloutPercentage = async (flagId: string, percentage: number) => {
        try {
            setUpdating(flagId);

            const { error } = await supabase
                .from('feature_flags' as any)
                .update({
                    rollout_percentage: percentage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', flagId);

            if (error) throw error;

            // Update local state
            setFlags(prev =>
                prev.map(flag =>
                    flag.id === flagId ? { ...flag, rollout_percentage: percentage } : flag
                )
            );
        } catch (error) {
            console.error('Failed to update rollout percentage:', error);
        } finally {
            setUpdating(null);
        }
    };

    const getWinningVariant = (rates: ABTestConversionRate[]): string | null => {
        if (rates.length < 2) return null;

        const sorted = [...rates].sort((a, b) => b.conversion_rate - a.conversion_rate);
        const winner = sorted[0];
        const runnerUp = sorted[1];

        // Only declare a winner if the difference is meaningful (>10% relative improvement)
        if (winner.conversions >= 10 && (winner.conversion_rate - runnerUp.conversion_rate) / runnerUp.conversion_rate > 0.1) {
            return winner.variant;
        }

        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Feature Flags & Experiments</h1>
                    <p className="text-muted-foreground">
                        Manage A/B tests and feature rollouts
                    </p>
                </div>
                <Button onClick={loadFeatureFlags} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-6">
                {flags.map(flag => {
                    const rates = conversionData.get(flag.flag_key) || [];
                    const winningVariant = getWinningVariant(rates);
                    const totalExposures = rates.reduce((sum, r) => sum + r.exposures, 0);
                    const totalConversions = rates.reduce((sum, r) => sum + r.conversions, 0);

                    // Statistical analysis for 2-variant tests
                    let analysis = null;
                    if (rates.length === 2) {
                        analysis = analyzeABTest(
                            rates[0].variant,
                            rates[0].exposures,
                            rates[0].conversions,
                            rates[1].variant,
                            rates[1].exposures,
                            rates[1].conversions
                        );
                    }

                    return (
                        <Card key={flag.id} className="border-primary/20">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle>{flag.flag_name}</CardTitle>
                                            <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                                                {flag.enabled ? 'Active' : 'Inactive'}
                                            </Badge>
                                            {winningVariant && (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                                    <TrendingUp className="mr-1 h-3 w-3" />
                                                    {winningVariant} winning
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>{flag.description}</CardDescription>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {totalExposures.toLocaleString()} exposures
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <BarChart3 className="h-3 w-3" />
                                                {totalConversions.toLocaleString()} conversions
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={flag.enabled}
                                            onCheckedChange={() => toggleFlag(flag.id, flag.enabled)}
                                            disabled={updating === flag.id}
                                        />
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Rollout Percentage Control */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <label className="font-medium">Rollout Percentage</label>
                                        <span className="text-muted-foreground">{flag.rollout_percentage}%</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {[0, 25, 50, 75, 100].map(pct => (
                                            <Button
                                                key={pct}
                                                variant={flag.rollout_percentage === pct ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => updateRolloutPercentage(flag.id, pct)}
                                                disabled={updating === flag.id}
                                                className="flex-1"
                                            >
                                                {pct}%
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Variant Performance */}
                                {rates.length > 0 && (
                                    <div className="space-y-3 rounded-lg border border-white/10 bg-slate-950/40 p-4">
                                        <h4 className="text-sm font-semibold">Variant Performance</h4>
                                        <div className="space-y-2">
                                            {rates.map(rate => (
                                                <div
                                                    key={rate.variant}
                                                    className="flex items-center justify-between rounded-md border border-white/5 bg-slate-900/40 p-3"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium capitalize">{rate.variant}</span>
                                                            {rate.variant === winningVariant && (
                                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                                                    Winner
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {rate.exposures.toLocaleString()} exposures • {rate.conversions.toLocaleString()} conversions
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-primary">
                                                            {rate.conversion_rate.toFixed(1)}%
                                                        </div>
                                                        {rate.avg_time_to_convert && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Avg time: {rate.avg_time_to_convert}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Statistical Significance Analysis */}
                                {analysis && (
                                    <div className="space-y-3 rounded-lg border border-white/10 bg-slate-950/40 p-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold">Statistical Analysis</h4>
                                            {analysis.significance.level === 'highly-significant' || analysis.significance.level === 'significant' ? (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                    {analysis.significance.label}
                                                </Badge>
                                            ) : analysis.significance.level === 'marginally-significant' ? (
                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                                                    <AlertCircle className="mr-1 h-3 w-3" />
                                                    {analysis.significance.label}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30">
                                                    {analysis.significance.label}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-muted-foreground mb-1">P-Value</div>
                                                <div className="font-mono font-semibold">{analysis.pValue.toFixed(4)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground mb-1">Uplift</div>
                                                <div className={`font-semibold ${analysis.uplift > 0 ? 'text-emerald-400' : analysis.uplift < 0 ? 'text-red-400' : ''}`}>
                                                    {analysis.uplift > 0 ? '+' : ''}{analysis.uplift.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground">{analysis.significance.description}</div>
                                            {(!analysis.sampleSize.variant1.adequate || !analysis.sampleSize.variant2.adequate) && (
                                                <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-400">
                                                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                                    <span>
                                                        {analysis.sampleSize.variant1.recommendation || analysis.sampleSize.variant2.recommendation}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="rounded-md bg-primary/10 border border-primary/30 p-2 text-xs text-primary">
                                                <strong>Recommendation:</strong> {analysis.recommendation}
                                            </div>
                                        </div>

                                        {/* Confidence Intervals */}
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <div className="text-xs font-medium text-muted-foreground">95% Confidence Intervals</div>
                                            {rates.map((rate, idx) => {
                                                const ci = idx === 0 ? analysis.confidence.variant1 : analysis.confidence.variant2;
                                                return (
                                                    <div key={rate.variant} className="flex items-center justify-between text-xs">
                                                        <span className="capitalize text-muted-foreground">{rate.variant}</span>
                                                        <span className="font-mono">
                                                            {(ci.lower * 100).toFixed(1)}% - {(ci.upper * 100).toFixed(1)}%
                                                            <span className="text-muted-foreground ml-1">(±{(ci.margin * 100).toFixed(1)}%)</span>
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Variant Configuration */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Variant Distribution</h4>
                                    <div className="grid gap-2">
                                        {flag.variants.map((variant: VariantConfig) => (
                                            <div
                                                key={variant.name}
                                                className="flex items-center justify-between rounded-md border border-white/5 bg-slate-900/40 p-2 text-sm"
                                            >
                                                <span className="capitalize">{variant.name}</span>
                                                <Badge variant="secondary">{(variant.weight * 100).toFixed(0)}%</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {flags.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">No Feature Flags</h3>
                            <p className="text-sm text-muted-foreground">
                                Create your first feature flag to start experimenting
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Automated Insights Panel */}
                <AnalyticsInsightsPanel />
            </div>
        </div>
    );
}
