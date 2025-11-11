
-- Create public wrapper for metrics.get_teachers_signal_metrics()
-- This allows the frontend to call it via supabase.rpc()

CREATE OR REPLACE FUNCTION public.get_teachers_signal_metrics()
RETURNS TABLE(
  total_stories INTEGER,
  division_coverage_pct NUMERIC,
  goal_target INTEGER,
  coverage_goal_pct NUMERIC,
  progress_pct NUMERIC,
  milestones JSONB,
  daily_counts JSONB,
  streak_summary JSONB,
  last_updated TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'metrics', 'public'
AS $$
  SELECT * FROM metrics.get_teachers_signal_metrics();
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_teachers_signal_metrics() TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_teachers_signal_metrics() IS 
'Public wrapper for metrics.get_teachers_signal_metrics(). Returns comprehensive Teachers'' Signal metrics including total stories, division coverage with n≥20 suppression, milestones, daily counts with weekly totals, streak statistics, and last update timestamp.';
