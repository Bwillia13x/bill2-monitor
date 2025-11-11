// Analytics Insights Dashboard Component
// Displays automated insights from funnel, A/B test, and engagement analysis

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, TrendingUp, Lightbulb } from 'lucide-react';
import { generateInsights, type Insight } from '@/lib/analyticsInsights';
import type { FunnelDropoff, ABTestConversionRate, HeatmapEngagementCohort } from '@/types/analytics';
import { analyzeABTest } from '@/lib/abTestStats';

export function AnalyticsInsightsPanel() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            setLoading(true);

            // Note: Analytics functions not yet implemented in database
            // This panel will be functional once funnel and A/B test tables/functions are added
            
            // Placeholder for future implementation
            const generatedInsights = generateInsights({
                funnels: [],
                abTests: [],
                engagementCohorts: undefined,
            });

            setInsights(generatedInsights);
        } catch (error) {
            console.error('Failed to load insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: Insight['type']) => {
        switch (type) {
            case 'critical':
                return <AlertCircle className="h-5 w-5 text-red-400" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-amber-400" />;
            case 'success':
                return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
            default:
                return <Info className="h-5 w-5 text-blue-400" />;
        }
    };

    const getTypeBadgeClass = (type: Insight['type']) => {
        switch (type) {
            case 'critical':
                return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'warning':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            case 'success':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            default:
                return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        }
    };

    const getCategoryLabel = (category: Insight['category']) => {
        switch (category) {
            case 'funnel':
                return 'Funnel';
            case 'ab-test':
                return 'A/B Test';
            case 'engagement':
                return 'Engagement';
            case 'performance':
                return 'Performance';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-12">
                    <div className="text-center space-y-2">
                        <Lightbulb className="h-12 w-12 text-primary mx-auto animate-pulse" />
                        <p className="text-sm text-muted-foreground">Analyzing data...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <CardTitle>Automated Insights</CardTitle>
                </div>
                <CardDescription>
                    AI-powered recommendations based on your analytics data
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {insights.length === 0 ? (
                    <div className="text-center p-8 text-sm text-muted-foreground">
                        <Lightbulb className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p>No insights available yet. Collect more data to see recommendations.</p>
                    </div>
                ) : (
                    insights.map(insight => (
                        <div
                            key={insight.id}
                            className="rounded-lg border border-white/10 bg-slate-950/40 p-4 space-y-3"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">{getTypeIcon(insight.type)}</div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge variant="outline" className="text-xs">
                                                {getCategoryLabel(insight.category)}
                                            </Badge>
                                            <Badge variant="outline" className={`text-xs ${getTypeBadgeClass(insight.type)}`}>
                                                {insight.impact} impact
                                            </Badge>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground">{insight.description}</p>

                                    <div className="rounded-md bg-primary/10 border border-primary/30 p-3 space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-medium text-primary">
                                            <Lightbulb className="h-3 w-3" />
                                            Recommendation
                                        </div>
                                        <p className="text-sm text-primary">{insight.recommendation}</p>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Confidence: {insight.confidence}%</span>
                                        <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${insight.confidence}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
