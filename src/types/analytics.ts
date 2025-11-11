// Analytics types for Phase 2 implementation
// Auto-generated types for telemetry_events, feature_flags, experiment_exposures, and funnel_events tables

export interface TelemetryEvent {
    id: string;
    session_id: string;
    event_name: string;
    event_type: 'custom' | 'page_view' | 'interaction' | 'conversion';
    properties: Record<string, unknown>;
    url: string;
    device: string;
    app_version: string;
    user_id?: string;
    created_at: string;
    ts: number;
}

export interface FeatureFlag {
    id: string;
    flag_key: string;
    flag_name: string;
    description?: string;
    enabled: boolean;
    rollout_percentage: number;
    variants: VariantConfig[];
    targeting_rules?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

export interface VariantConfig {
    name: string;
    weight: number;
    config: Record<string, unknown>;
}

export interface ExperimentExposure {
    id: string;
    feature_flag_id?: string;
    flag_key: string;
    user_id: string;
    variant: string;
    session_id: string;
    exposed_at: string;
    properties: Record<string, unknown>;
}

export interface FunnelEvent {
    id: string;
    funnel_name: string;
    step_name: string;
    step_order: number;
    user_id: string;
    session_id: string;
    occurred_at: string;
    properties: Record<string, unknown>;
    completed: boolean;
}

// RPC Function Return Types

export interface ABTestConversionRate {
    variant: string;
    exposures: number;
    conversions: number;
    conversion_rate: number;
    avg_time_to_convert: string; // PostgreSQL interval as string
}

export interface FunnelDropoff {
    step_name: string;
    step_order: number;
    users_entered: number;
    users_completed: number;
    drop_off_count: number;
    drop_off_rate: number;
    avg_time_in_step: string; // PostgreSQL interval as string
}

export interface HeatmapEngagementCohort {
    engagement_level: 'low' | 'medium' | 'high';
    user_count: number;
    avg_hover_count: number;
    avg_click_count: number;
    avg_time_on_map: string; // PostgreSQL interval as string
    conversion_to_signal_rate: number;
}

// Funnel definition types

export const FUNNELS = {
    SIGN_CREATION: 'sign_creation',
    SIGNAL_SUBMISSION: 'signal_submission',
    SHARE_FLOW: 'share_flow',
} as const;

export type FunnelName = typeof FUNNELS[keyof typeof FUNNELS];

export interface FunnelStep {
    name: string;
    order: number;
    description: string;
}

export const SIGN_CREATION_FUNNEL: FunnelStep[] = [
    { name: 'start', order: 1, description: 'User opens sign studio' },
    { name: 'customize', order: 2, description: 'User customizes sign content' },
    { name: 'preview', order: 3, description: 'User previews generated sign' },
    { name: 'download', order: 4, description: 'User downloads sign image' },
    { name: 'share', order: 5, description: 'User shares sign (conversion)' },
];

export const SIGNAL_SUBMISSION_FUNNEL: FunnelStep[] = [
    { name: 'view_thermometer', order: 1, description: 'User views signal thermometer' },
    { name: 'interact', order: 2, description: 'User interacts with slider' },
    { name: 'submit', order: 3, description: 'User submits signal (conversion)' },
];

export const SHARE_FLOW_FUNNEL: FunnelStep[] = [
    { name: 'modal_open', order: 1, description: 'Share modal opens' },
    { name: 'select_platform', order: 2, description: 'User selects share platform' },
    { name: 'share_complete', order: 3, description: 'User completes share (conversion)' },
];
