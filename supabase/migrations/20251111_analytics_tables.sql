-- Phase 2: Analytics & Optimization Database Schema
-- Creates tables for telemetry events, feature flag experiments, and funnel analysis

-- ============================================================================
-- TELEMETRY EVENTS TABLE
-- ============================================================================
-- Stores all custom telemetry events for analysis
CREATE TABLE IF NOT EXISTS public.telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_name text NOT NULL,
  event_type text NOT NULL DEFAULT 'custom', -- 'custom', 'page_view', 'interaction', 'conversion'
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  url text NOT NULL,
  device text NOT NULL,
  app_version text NOT NULL,
  user_id uuid, -- Optional - links to auth.users if authenticated
  created_at timestamptz NOT NULL DEFAULT now(),
  ts bigint NOT NULL -- Client-side timestamp
);

-- Indexes for common query patterns
CREATE INDEX idx_telemetry_events_session ON telemetry_events(session_id);
CREATE INDEX idx_telemetry_events_event_name ON telemetry_events(event_name);
CREATE INDEX idx_telemetry_events_created_at ON telemetry_events(created_at DESC);
CREATE INDEX idx_telemetry_events_user_id ON telemetry_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_telemetry_events_properties ON telemetry_events USING gin(properties);

-- RLS Policies
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (telemetry collection)
CREATE POLICY "Allow anonymous telemetry insert"
  ON public.telemetry_events
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read telemetry data
CREATE POLICY "Admin read telemetry"
  ON public.telemetry_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@digitalstrike.ca'
    )
  );

-- ============================================================================
-- FEATURE FLAGS TABLE
-- ============================================================================
-- Centralized feature flag configuration
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  flag_name text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  variants jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of variant configs
  targeting_rules jsonb, -- Optional targeting criteria
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Index for lookups
CREATE INDEX idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

-- RLS Policies
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags (needed for client-side bucketing)
CREATE POLICY "Public read feature flags"
  ON public.feature_flags
  FOR SELECT
  USING (true);

-- Only admins can modify feature flags
CREATE POLICY "Admin modify feature flags"
  ON public.feature_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@digitalstrike.ca'
    )
  );

-- ============================================================================
-- EXPERIMENT EXPOSURES TABLE
-- ============================================================================
-- Tracks when users are exposed to feature flag variants
CREATE TABLE IF NOT EXISTS public.experiment_exposures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id uuid REFERENCES feature_flags(id) ON DELETE CASCADE,
  flag_key text NOT NULL,
  user_id text NOT NULL, -- Anonymous user ID (hashed)
  variant text NOT NULL,
  session_id text NOT NULL,
  exposed_at timestamptz NOT NULL DEFAULT now(),
  properties jsonb DEFAULT '{}'::jsonb
);

-- Indexes for analysis
CREATE INDEX idx_experiment_exposures_flag ON experiment_exposures(flag_key);
CREATE INDEX idx_experiment_exposures_user ON experiment_exposures(user_id);
CREATE INDEX idx_experiment_exposures_variant ON experiment_exposures(variant);
CREATE INDEX idx_experiment_exposures_exposed_at ON experiment_exposures(exposed_at DESC);
CREATE UNIQUE INDEX idx_experiment_exposures_unique ON experiment_exposures(flag_key, user_id, session_id);

-- RLS Policies
ALTER TABLE public.experiment_exposures ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (exposure tracking)
CREATE POLICY "Allow exposure tracking"
  ON public.experiment_exposures
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read exposures
CREATE POLICY "Admin read exposures"
  ON public.experiment_exposures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@digitalstrike.ca'
    )
  );

-- ============================================================================
-- FUNNEL EVENTS TABLE
-- ============================================================================
-- Tracks user progression through defined funnels (e.g., sign creation)
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name text NOT NULL,
  step_name text NOT NULL,
  step_order integer NOT NULL,
  user_id text NOT NULL, -- Anonymous user ID
  session_id text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  properties jsonb DEFAULT '{}'::jsonb,
  completed boolean NOT NULL DEFAULT false -- True if this is the final step
);

-- Indexes for funnel analysis
CREATE INDEX idx_funnel_events_funnel ON funnel_events(funnel_name);
CREATE INDEX idx_funnel_events_user ON funnel_events(user_id);
CREATE INDEX idx_funnel_events_session ON funnel_events(session_id);
CREATE INDEX idx_funnel_events_occurred_at ON funnel_events(occurred_at DESC);
CREATE INDEX idx_funnel_events_step ON funnel_events(funnel_name, step_order);

-- RLS Policies
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (funnel tracking)
CREATE POLICY "Allow funnel tracking"
  ON public.funnel_events
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read funnel data
CREATE POLICY "Admin read funnel data"
  ON public.funnel_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@digitalstrike.ca'
    )
  );

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

-- Function: Get A/B test conversion rates by variant
CREATE OR REPLACE FUNCTION get_ab_test_conversion_rates(
  p_flag_key text,
  p_conversion_event text,
  p_start_date timestamptz DEFAULT now() - interval '30 days',
  p_end_date timestamptz DEFAULT now()
)
RETURNS TABLE(
  variant text,
  exposures bigint,
  conversions bigint,
  conversion_rate numeric,
  avg_time_to_convert interval
) AS $$
BEGIN
  RETURN QUERY
  WITH exposures AS (
    SELECT 
      ee.variant,
      ee.user_id,
      ee.exposed_at
    FROM experiment_exposures ee
    WHERE ee.flag_key = p_flag_key
      AND ee.exposed_at BETWEEN p_start_date AND p_end_date
  ),
  conversions AS (
    SELECT 
      te.properties->>'userId' as user_id,
      te.created_at
    FROM telemetry_events te
    WHERE te.event_name = p_conversion_event
      AND te.created_at BETWEEN p_start_date AND p_end_date
  )
  SELECT 
    e.variant,
    COUNT(DISTINCT e.user_id) as exposures,
    COUNT(DISTINCT c.user_id) as conversions,
    ROUND(
      (COUNT(DISTINCT c.user_id)::numeric / NULLIF(COUNT(DISTINCT e.user_id), 0)) * 100, 
      2
    ) as conversion_rate,
    AVG(c.created_at - e.exposed_at) as avg_time_to_convert
  FROM exposures e
  LEFT JOIN conversions c ON e.user_id = c.user_id AND c.created_at >= e.exposed_at
  GROUP BY e.variant
  ORDER BY e.variant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get funnel drop-off analysis
CREATE OR REPLACE FUNCTION get_funnel_dropoff(
  p_funnel_name text,
  p_start_date timestamptz DEFAULT now() - interval '7 days',
  p_end_date timestamptz DEFAULT now()
)
RETURNS TABLE(
  step_name text,
  step_order integer,
  users_entered bigint,
  users_completed bigint,
  drop_off_count bigint,
  drop_off_rate numeric,
  avg_time_in_step interval
) AS $$
BEGIN
  RETURN QUERY
  WITH funnel_steps AS (
    SELECT DISTINCT
      fe.step_name,
      fe.step_order
    FROM funnel_events fe
    WHERE fe.funnel_name = p_funnel_name
    ORDER BY fe.step_order
  ),
  step_completions AS (
    SELECT 
      fe.step_name,
      fe.step_order,
      fe.user_id,
      fe.session_id,
      fe.occurred_at,
      LEAD(fe.occurred_at) OVER (PARTITION BY fe.user_id, fe.session_id ORDER BY fe.step_order) as next_step_time
    FROM funnel_events fe
    WHERE fe.funnel_name = p_funnel_name
      AND fe.occurred_at BETWEEN p_start_date AND p_end_date
  )
  SELECT 
    fs.step_name,
    fs.step_order,
    COUNT(DISTINCT sc.user_id) as users_entered,
    COUNT(DISTINCT CASE WHEN sc.next_step_time IS NOT NULL THEN sc.user_id END) as users_completed,
    COUNT(DISTINCT CASE WHEN sc.next_step_time IS NULL THEN sc.user_id END) as drop_off_count,
    ROUND(
      (COUNT(DISTINCT CASE WHEN sc.next_step_time IS NULL THEN sc.user_id END)::numeric / 
       NULLIF(COUNT(DISTINCT sc.user_id), 0)) * 100,
      2
    ) as drop_off_rate,
    AVG(sc.next_step_time - sc.occurred_at) as avg_time_in_step
  FROM funnel_steps fs
  LEFT JOIN step_completions sc ON fs.step_name = sc.step_name
  GROUP BY fs.step_name, fs.step_order
  ORDER BY fs.step_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get heatmap engagement metrics
CREATE OR REPLACE FUNCTION get_heatmap_engagement_cohorts(
  p_start_date timestamptz DEFAULT now() - interval '7 days',
  p_end_date timestamptz DEFAULT now()
)
RETURNS TABLE(
  engagement_level text,
  user_count bigint,
  avg_hover_count numeric,
  avg_click_count numeric,
  avg_time_on_map interval,
  conversion_to_signal_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH user_engagement AS (
    SELECT 
      te.properties->>'userId' as user_id,
      COUNT(*) FILTER (WHERE te.event_name = 'heatmap_hover') as hover_count,
      COUNT(*) FILTER (WHERE te.event_name = 'heatmap_click') as click_count,
      SUM((te.properties->>'duration')::integer) FILTER (WHERE te.event_name = 'heatmap_view') as total_time_ms
    FROM telemetry_events te
    WHERE te.event_name IN ('heatmap_hover', 'heatmap_click', 'heatmap_view')
      AND te.created_at BETWEEN p_start_date AND p_end_date
    GROUP BY te.properties->>'userId'
  ),
  conversions AS (
    SELECT DISTINCT
      te.properties->>'userId' as user_id
    FROM telemetry_events te
    WHERE te.event_name = 'signal_submitted'
      AND te.created_at BETWEEN p_start_date AND p_end_date
  ),
  engagement_cohorts AS (
    SELECT 
      ue.*,
      CASE 
        WHEN ue.hover_count + ue.click_count >= 10 THEN 'high'
        WHEN ue.hover_count + ue.click_count >= 3 THEN 'medium'
        ELSE 'low'
      END as engagement_level,
      c.user_id IS NOT NULL as converted
    FROM user_engagement ue
    LEFT JOIN conversions c ON ue.user_id = c.user_id
  )
  SELECT 
    ec.engagement_level,
    COUNT(*) as user_count,
    ROUND(AVG(ec.hover_count), 2) as avg_hover_count,
    ROUND(AVG(ec.click_count), 2) as avg_click_count,
    AVG(make_interval(secs => COALESCE(ec.total_time_ms, 0) / 1000.0)) as avg_time_on_map,
    ROUND(
      (COUNT(*) FILTER (WHERE ec.converted)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as conversion_to_signal_rate
  FROM engagement_cohorts ec
  GROUP BY ec.engagement_level
  ORDER BY 
    CASE ec.engagement_level
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_ab_test_conversion_rates TO authenticated;
GRANT EXECUTE ON FUNCTION get_funnel_dropoff TO authenticated;
GRANT EXECUTE ON FUNCTION get_heatmap_engagement_cohorts TO authenticated;

-- ============================================================================
-- SEED DATA: Insert default feature flags
-- ============================================================================
INSERT INTO public.feature_flags (flag_key, flag_name, description, enabled, rollout_percentage, variants)
VALUES 
  (
    'thermometer_animation',
    'Thermometer Animation Test',
    'A/B test for thermometer fill animation style',
    true,
    100,
    '[
      {"name": "control", "weight": 0.5, "config": {"animationStyle": "linear"}},
      {"name": "bounce", "weight": 0.5, "config": {"animationStyle": "bounce"}}
    ]'::jsonb
  ),
  (
    'share_modal_cta',
    'Share Modal CTA Test',
    'A/B test for share modal call-to-action text',
    true,
    100,
    '[
      {"name": "control", "weight": 0.5, "config": {"ctaText": "Share Your Voice"}},
      {"name": "urgent", "weight": 0.5, "config": {"ctaText": "Spread the Word Now"}}
    ]'::jsonb
  ),
  (
    'heatmap_tooltip_style',
    'Heatmap Tooltip Style Test',
    'A/B test for heatmap tooltip design',
    false,
    0,
    '[
      {"name": "minimal", "weight": 0.5, "config": {"style": "minimal"}},
      {"name": "detailed", "weight": 0.5, "config": {"style": "detailed"}}
    ]'::jsonb
  )
ON CONFLICT (flag_key) DO NOTHING;

COMMENT ON TABLE telemetry_events IS 'Stores all custom telemetry events for product analytics';
COMMENT ON TABLE feature_flags IS 'Central feature flag configuration for A/B testing and gradual rollouts';
COMMENT ON TABLE experiment_exposures IS 'Tracks user exposure to feature flag variants for experiment analysis';
COMMENT ON TABLE funnel_events IS 'Tracks user progression through multi-step funnels';
COMMENT ON FUNCTION get_ab_test_conversion_rates IS 'Calculates conversion rates by variant for A/B test analysis';
COMMENT ON FUNCTION get_funnel_dropoff IS 'Analyzes user drop-off at each step of a funnel';
COMMENT ON FUNCTION get_heatmap_engagement_cohorts IS 'Segments users by heatmap engagement level and analyzes conversion rates';
