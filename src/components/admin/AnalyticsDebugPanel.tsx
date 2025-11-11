// Analytics Debug Panel
// Developer tools for viewing live telemetry events, verifying tracking, and testing queries

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Trash2, Play, Database, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { telemetryInstance } from '@/lib/telemetry';
import type { TelemetryEvent } from '@/types/analytics';

export function AnalyticsDebugPanel() {
    const [liveEvents, setLiveEvents] = useState<TelemetryEvent[]>([]);
    const [dbEvents, setDbEvents] = useState<any[]>([]);
    const [funnelEvents, setFunnelEvents] = useState<any[]>([]);
    const [experimentExposures, setExperimentExposures] = useState<any[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [queryLoading, setQueryLoading] = useState<string | null>(null);

    // Subscribe to live telemetry events
    useEffect(() => {
        if (!isRecording) return;

        const handleEvent = (event: TelemetryEvent) => {
            setLiveEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
        };

        // Access the internal event emitter if available
        // This is a simplified version - in production, telemetry would expose a subscription API
        const interval = setInterval(() => {
            // For now, we'll just poll the queue
            loadRecentDbEvents();
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, [isRecording]);

    const loadRecentDbEvents = async () => {
        setQueryLoading('telemetry');
        try {
            const { data } = await supabase
                .from('telemetry_events' as any)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            setDbEvents(data || []);
        } catch (error) {
            console.error('Failed to load telemetry events:', error);
        } finally {
            setQueryLoading(null);
        }
    };

    const loadFunnelEvents = async () => {
        setQueryLoading('funnel');
        try {
            const { data } = await supabase
                .from('funnel_events' as any)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            setFunnelEvents(data || []);
        } catch (error) {
            console.error('Failed to load funnel events:', error);
        } finally {
            setQueryLoading(null);
        }
    };

    const loadExperimentExposures = async () => {
        setQueryLoading('exposures');
        try {
            const { data } = await supabase
                .from('experiment_exposures' as any)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            setExperimentExposures(data || []);
        } catch (error) {
            console.error('Failed to load experiment exposures:', error);
        } finally {
            setQueryLoading(null);
        }
    };

    const clearLiveEvents = () => {
        setLiveEvents([]);
    };

    const testTrackEvent = () => {
        telemetryInstance.sendEvent('debug_test_event', {
            source: 'analytics_debug_panel',
            timestamp: new Date().toISOString(),
            test: true,
        });
    };

    const formatJson = (obj: any) => {
        try {
            return JSON.stringify(obj, null, 2);
        } catch {
            return String(obj);
        }
    };

    const getEventBadgeColor = (eventName: string) => {
        if (eventName.includes('error') || eventName.includes('fail')) {
            return 'bg-red-500/10 text-red-400 border-red-500/30';
        }
        if (eventName.includes('success') || eventName.includes('complete')) {
            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        }
        if (eventName.includes('start') || eventName.includes('begin')) {
            return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        }
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Code className="h-5 w-5 text-primary" />
                        <CardTitle>Analytics Debugger</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={testTrackEvent}
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Test Event
                        </Button>
                        <Button
                            variant={isRecording ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => setIsRecording(!isRecording)}
                        >
                            {isRecording ? (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Stop Recording
                                </>
                            ) : (
                                <>
                                    <Activity className="h-4 w-4 mr-2" />
                                    Start Recording
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                <CardDescription>
                    View live events, inspect payloads, and test analytics queries
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="live" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="live">
                            Live Events {liveEvents.length > 0 && `(${liveEvents.length})`}
                        </TabsTrigger>
                        <TabsTrigger value="telemetry">Database Events</TabsTrigger>
                        <TabsTrigger value="funnel">Funnel Events</TabsTrigger>
                        <TabsTrigger value="exposures">A/B Exposures</TabsTrigger>
                    </TabsList>

                    <TabsContent value="live" className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {isRecording ? (
                                    <span className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                        Recording live events...
                                    </span>
                                ) : (
                                    'Click "Start Recording" to capture live events'
                                )}
                            </p>
                            {liveEvents.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearLiveEvents}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {liveEvents.map((event, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-white/10 bg-slate-950/40 p-3 space-y-2 font-mono text-xs"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <Badge variant="outline" className={getEventBadgeColor(event.event_name)}>
                                            {event.event_name}
                                        </Badge>
                                        <span className="text-muted-foreground">
                                            {new Date(event.ts).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                                        {formatJson(event.properties)}
                                    </pre>
                                </div>
                            ))}
                            {liveEvents.length === 0 && (
                                <div className="text-center p-8 text-sm text-muted-foreground">
                                    No events captured yet
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="telemetry" className="space-y-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadRecentDbEvents}
                            disabled={queryLoading === 'telemetry'}
                        >
                            <Database className="h-4 w-4 mr-2" />
                            {queryLoading === 'telemetry' ? 'Loading...' : 'Refresh'}
                        </Button>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {dbEvents.map((event: any, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-white/10 bg-slate-950/40 p-3 space-y-2 font-mono text-xs"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <Badge variant="outline" className={getEventBadgeColor(event.event_name)}>
                                            {event.event_name}
                                        </Badge>
                                        <span className="text-muted-foreground">
                                            {new Date(event.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Session:</span>{' '}
                                            {event.session_id?.substring(0, 8)}...
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">User:</span>{' '}
                                            {event.user_id ? event.user_id.substring(0, 8) + '...' : 'Anonymous'}
                                        </div>
                                    </div>
                                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                                        {formatJson(event.properties)}
                                    </pre>
                                </div>
                            ))}
                            {dbEvents.length === 0 && (
                                <div className="text-center p-8 text-sm text-muted-foreground">
                                    Click "Refresh" to load database events
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="funnel" className="space-y-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadFunnelEvents}
                            disabled={queryLoading === 'funnel'}
                        >
                            <Database className="h-4 w-4 mr-2" />
                            {queryLoading === 'funnel' ? 'Loading...' : 'Refresh'}
                        </Button>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {funnelEvents.map((event: any, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-white/10 bg-slate-950/40 p-3 space-y-2 font-mono text-xs"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                                {event.funnel_name}
                                            </Badge>
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                                {event.step_name}
                                            </Badge>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {new Date(event.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Session:</span>{' '}
                                            {event.session_id?.substring(0, 8)}...
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">User:</span>{' '}
                                            {event.user_id ? event.user_id.substring(0, 8) + '...' : 'Anonymous'}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Step #:</span> {event.step_order}
                                        </div>
                                    </div>
                                    {event.metadata && (
                                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                                            {formatJson(event.metadata)}
                                        </pre>
                                    )}
                                </div>
                            ))}
                            {funnelEvents.length === 0 && (
                                <div className="text-center p-8 text-sm text-muted-foreground">
                                    Click "Refresh" to load funnel events
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="exposures" className="space-y-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadExperimentExposures}
                            disabled={queryLoading === 'exposures'}
                        >
                            <Database className="h-4 w-4 mr-2" />
                            {queryLoading === 'exposures' ? 'Loading...' : 'Refresh'}
                        </Button>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {experimentExposures.map((exposure: any, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-white/10 bg-slate-950/40 p-3 space-y-2 font-mono text-xs"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                                {exposure.flag_key}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    exposure.variant === 'control'
                                                        ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                                                        : 'bg-primary/10 text-primary border-primary/30'
                                                }
                                            >
                                                {exposure.variant}
                                            </Badge>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {new Date(exposure.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Session:</span>{' '}
                                            {exposure.session_id?.substring(0, 8)}...
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">User:</span>{' '}
                                            {exposure.user_id ? exposure.user_id.substring(0, 8) + '...' : 'Anonymous'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {exposure.converted ? (
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Converted
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30">
                                                Not Converted
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {experimentExposures.length === 0 && (
                                <div className="text-center p-8 text-sm text-muted-foreground">
                                    Click "Refresh" to load A/B test exposures
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
