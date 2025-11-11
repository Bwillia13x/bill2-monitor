// Real-time Analytics Dashboard
// Live metrics using Supabase realtime subscriptions

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Users, Zap, Eye, MousePointer } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface LiveMetrics {
    eventsPerMinute: number;
    activeUsers: number;
    signalSubmissions: number;
    signCreations: number;
    abTestExposures: number;
    funnelProgression: {
        funnel: string;
        step: string;
        count: number;
    }[];
}

export function RealTimeAnalyticsDashboard() {
    const [metrics, setMetrics] = useState<LiveMetrics>({
        eventsPerMinute: 0,
        activeUsers: 0,
        signalSubmissions: 0,
        signCreations: 0,
        abTestExposures: 0,
        funnelProgression: [],
    });
    const [isConnected, setIsConnected] = useState(false);
    const [eventCount, setEventCount] = useState(0);
    const [lastMinuteEvents, setLastMinuteEvents] = useState<number[]>([]);

    // Initialize realtime subscriptions
    useEffect(() => {
        let telemetryChannel: RealtimeChannel;
        let funnelChannel: RealtimeChannel;
        let exposureChannel: RealtimeChannel;

        const setupRealtimeSubscriptions = async () => {
            // Subscribe to telemetry_events table
            telemetryChannel = supabase
                .channel('telemetry-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'telemetry_events',
                    },
                    (payload) => {
                        handleTelemetryEvent(payload.new);
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('[RealTime] Connected to telemetry events');
                        setIsConnected(true);
                    }
                });

            // Subscribe to funnel_events table
            funnelChannel = supabase
                .channel('funnel-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'funnel_events',
                    },
                    (payload) => {
                        handleFunnelEvent(payload.new);
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('[RealTime] Connected to funnel events');
                    }
                });

            // Subscribe to experiment_exposures table
            exposureChannel = supabase
                .channel('exposure-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'experiment_exposures',
                    },
                    (payload) => {
                        handleExposureEvent(payload.new);
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('[RealTime] Connected to A/B exposures');
                    }
                });

            // Load initial metrics
            await loadInitialMetrics();
        };

        setupRealtimeSubscriptions();

        // Update events per minute calculation
        const intervalId = setInterval(() => {
            setLastMinuteEvents((prev) => {
                const now = Date.now();
                const oneMinuteAgo = now - 60000;
                const recentEvents = prev.filter((timestamp) => timestamp > oneMinuteAgo);
                setMetrics((m) => ({ ...m, eventsPerMinute: recentEvents.length }));
                return recentEvents;
            });
        }, 1000);

        return () => {
            clearInterval(intervalId);
            telemetryChannel?.unsubscribe();
            funnelChannel?.unsubscribe();
            exposureChannel?.unsubscribe();
        };
    }, []);

    const loadInitialMetrics = async () => {
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

        // Load recent events count
        const { count: telemetryCount } = await supabase
            .from('telemetry_events' as any)
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneMinuteAgo);

        // Load active users (unique sessions in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 300000).toISOString();
        const { data: sessionData } = await supabase
            .from('telemetry_events' as any)
            .select('session_id')
            .gte('created_at', fiveMinutesAgo);

        const uniqueSessions = new Set(
            sessionData?.map((row: any) => row.session_id).filter(Boolean)
        );

        // Load recent signal submissions
        const { count: signalCount } = await supabase
            .from('telemetry_events' as any)
            .select('*', { count: 'exact', head: true })
            .eq('event_name', 'signal_submitted')
            .gte('created_at', oneMinuteAgo);

        // Load recent sign creations
        const { count: signCount } = await supabase
            .from('funnel_events' as any)
            .select('*', { count: 'exact', head: true })
            .eq('funnel_name', 'sign_creation')
            .eq('step_name', 'download')
            .gte('created_at', oneMinuteAgo);

        // Load recent exposures
        const { count: exposureCount } = await supabase
            .from('experiment_exposures' as any)
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneMinuteAgo);

        // Load funnel progression
        const { data: funnelData } = await supabase
            .from('funnel_events' as any)
            .select('funnel_name, step_name')
            .gte('created_at', oneMinuteAgo);

        const funnelCounts = new Map<string, number>();
        funnelData?.forEach((event: any) => {
            const key = `${event.funnel_name}:${event.step_name}`;
            funnelCounts.set(key, (funnelCounts.get(key) || 0) + 1);
        });

        const funnelProgression = Array.from(funnelCounts.entries())
            .map(([key, count]) => {
                const [funnel, step] = key.split(':');
                return { funnel, step, count };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        setMetrics({
            eventsPerMinute: telemetryCount || 0,
            activeUsers: uniqueSessions.size,
            signalSubmissions: signalCount || 0,
            signCreations: signCount || 0,
            abTestExposures: exposureCount || 0,
            funnelProgression,
        });
    };

    const handleTelemetryEvent = useCallback((event: any) => {
        setEventCount((c) => c + 1);
        setLastMinuteEvents((prev) => [...prev, Date.now()]);

        // Update specific metrics based on event type
        if (event.event_name === 'signal_submitted') {
            setMetrics((m) => ({
                ...m,
                signalSubmissions: m.signalSubmissions + 1,
            }));
        }

        // Track unique active users
        setMetrics((m) => ({ ...m, activeUsers: m.activeUsers })); // Will be updated by periodic refresh
    }, []);

    const handleFunnelEvent = useCallback((event: any) => {
        setLastMinuteEvents((prev) => [...prev, Date.now()]);

        // Update funnel progression
        setMetrics((m) => {
            const progression = [...m.funnelProgression];
            const existingIndex = progression.findIndex(
                (p) => p.funnel === event.funnel_name && p.step === event.step_name
            );

            if (existingIndex >= 0) {
                progression[existingIndex].count += 1;
            } else {
                progression.push({
                    funnel: event.funnel_name,
                    step: event.step_name,
                    count: 1,
                });
            }

            // Keep top 10 and sort
            progression.sort((a, b) => b.count - a.count);
            const topProgression = progression.slice(0, 10);

            // Update sign creation count if download step
            if (event.funnel_name === 'sign_creation' && event.step_name === 'download') {
                return {
                    ...m,
                    signCreations: m.signCreations + 1,
                    funnelProgression: topProgression,
                };
            }

            return {
                ...m,
                funnelProgression: topProgression,
            };
        });
    }, []);

    const handleExposureEvent = useCallback((event: any) => {
        setLastMinuteEvents((prev) => [...prev, Date.now()]);
        setMetrics((m) => ({
            ...m,
            abTestExposures: m.abTestExposures + 1,
        }));
    }, []);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <CardTitle>Real-Time Analytics</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Live
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30">
                                Connecting...
                            </Badge>
                        )}
                    </div>
                </div>
                <CardDescription>
                    Live metrics from the last minute • Updated in real-time
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard
                        icon={<Activity className="h-4 w-4" />}
                        label="Events/Min"
                        value={metrics.eventsPerMinute}
                        color="primary"
                    />
                    <MetricCard
                        icon={<Users className="h-4 w-4" />}
                        label="Active Users"
                        value={metrics.activeUsers}
                        color="blue"
                    />
                    <MetricCard
                        icon={<TrendingUp className="h-4 w-4" />}
                        label="Signals"
                        value={metrics.signalSubmissions}
                        color="emerald"
                    />
                    <MetricCard
                        icon={<MousePointer className="h-4 w-4" />}
                        label="Signs Created"
                        value={metrics.signCreations}
                        color="amber"
                    />
                    <MetricCard
                        icon={<Eye className="h-4 w-4" />}
                        label="A/B Exposures"
                        value={metrics.abTestExposures}
                        color="purple"
                    />
                </div>

                {/* Funnel Progression */}
                {metrics.funnelProgression.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Active Funnel Steps</h4>
                        <div className="space-y-2">
                            {metrics.funnelProgression.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-white/5"
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {item.funnel}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">{item.step}</span>
                                    </div>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                        {item.count}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Total Event Counter */}
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Total Events This Session</p>
                    <p className="text-3xl font-bold text-primary">{eventCount.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    );
}

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: 'primary' | 'blue' | 'emerald' | 'amber' | 'purple';
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
    const colorClasses = {
        primary: 'text-primary',
        blue: 'text-blue-400',
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        purple: 'text-purple-400',
    };

    return (
        <div className="p-4 rounded-lg bg-slate-950/40 border border-white/10 space-y-2">
            <div className={`flex items-center gap-2 ${colorClasses[color]}`}>
                {icon}
                <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${colorClasses[color]}`}>
                {value.toLocaleString()}
            </p>
        </div>
    );
}
