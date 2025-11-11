
-- ============================================
-- Teachers' Signal Metrics Backend
-- ============================================

-- Create metrics schema
CREATE SCHEMA IF NOT EXISTS metrics;

-- ============================================
-- 1. Division Catalog Table
-- ============================================
CREATE TABLE IF NOT EXISTS metrics.division_catalog (
  id SERIAL PRIMARY KEY,
  division_name TEXT NOT NULL UNIQUE,
  division_code TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Populate Alberta school divisions
INSERT INTO metrics.division_catalog (division_name, division_code, region) VALUES
  ('Calgary Board of Education', 'CBE', 'Calgary'),
  ('Edmonton Public Schools', 'EPS', 'Edmonton'),
  ('Calgary Catholic School District', 'CCSD', 'Calgary'),
  ('Edmonton Catholic Schools', 'ECSD', 'Edmonton'),
  ('Golden Hills School Division', 'GHSD', 'Central'),
  ('Palliser Regional Schools', 'PRS', 'South'),
  ('Rocky View Schools', 'RVS', 'Calgary'),
  ('Chinook''s Edge School Division', 'CESD', 'Central'),
  ('Lethbridge School Division', 'LSD', 'South'),
  ('Grande Prairie Public School District', 'GPPSD', 'North'),
  ('Medicine Hat School District', 'MHSD', 'South'),
  ('Red Deer Public Schools', 'RDPS', 'Central'),
  ('St. Albert Public Schools', 'SAPS', 'Edmonton'),
  ('Parkland School Division', 'PSD', 'Central'),
  ('Elk Island Public Schools', 'EIPS', 'Edmonton'),
  ('Wolf Creek Public Schools', 'WCPS', 'Central'),
  ('Sturgeon Public Schools', 'SPS', 'Edmonton'),
  ('Black Gold Regional Schools', 'BGRS', 'Edmonton'),
  ('Foothills School Division', 'FSD', 'Calgary'),
  ('Holy Spirit Catholic Schools', 'HSCS', 'South'),
  ('Livingstone Range School Division', 'LRSD', 'South'),
  ('Clearview Public Schools', 'CPS', 'North'),
  ('Peace Wapiti School Division', 'PWSD', 'North'),
  ('Fort McMurray Public Schools', 'FMPS', 'North'),
  ('Wetaskiwin Regional Public Schools', 'WRPS', 'Central')
ON CONFLICT (division_name) DO NOTHING;

-- ============================================
-- 2. Daily Story Counts View (365 days)
-- ============================================
CREATE OR REPLACE VIEW metrics.daily_story_counts AS
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '364 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  )::date AS day
),
daily_counts AS (
  SELECT 
    created_at::date AS day,
    COUNT(*)::int AS count
  FROM public.stories
  WHERE approved = true
    AND created_at >= CURRENT_DATE - INTERVAL '364 days'
  GROUP BY created_at::date
),
weekly_aggregates AS (
  SELECT
    created_at::date AS day,
    SUM(COUNT(*)) OVER (
      ORDER BY created_at::date
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    )::int AS week_total
  FROM public.stories
  WHERE approved = true
    AND created_at >= CURRENT_DATE - INTERVAL '370 days'
  GROUP BY created_at::date
)
SELECT 
  ds.day AS date,
  COALESCE(dc.count, 0) AS count,
  wa.week_total
FROM date_series ds
LEFT JOIN daily_counts dc ON ds.day = dc.day
LEFT JOIN weekly_aggregates wa ON ds.day = wa.day
ORDER BY ds.day;

-- ============================================
-- 3. Teachers' Signal Metrics RPC
-- ============================================
CREATE OR REPLACE FUNCTION metrics.get_teachers_signal_metrics()
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'metrics', 'public'
AS $$
DECLARE
  v_total_stories INTEGER;
  v_total_divisions INTEGER;
  v_covered_divisions INTEGER;
  v_goal_target INTEGER := 1000;
  v_milestones JSONB;
  v_daily_counts JSONB;
  v_streak JSONB;
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_last_break DATE := NULL;
  v_prev_date DATE := NULL;
  v_streak_active BOOLEAN := true;
BEGIN
  -- Get total approved stories (no suppression on aggregate)
  SELECT COUNT(*)::int INTO v_total_stories
  FROM public.stories
  WHERE approved = true;

  -- Get division counts with n≥20 suppression
  SELECT 
    COUNT(DISTINCT dc.division_name)::int INTO v_total_divisions
  FROM metrics.division_catalog dc;

  SELECT 
    COUNT(DISTINCT s.district)::int INTO v_covered_divisions
  FROM public.stories s
  WHERE s.approved = true
    AND s.district IS NOT NULL
    AND s.district != ''
    AND s.district IN (SELECT division_name FROM metrics.division_catalog)
  GROUP BY s.district
  HAVING COUNT(*) >= 20;

  -- Calculate coverage percentage
  DECLARE
    v_coverage_pct NUMERIC;
  BEGIN
    IF v_total_divisions > 0 THEN
      v_coverage_pct := ROUND((v_covered_divisions::numeric / v_total_divisions) * 100, 1);
    ELSE
      v_coverage_pct := 0;
    END IF;

    -- Build milestones array
    v_milestones := jsonb_build_array(
      jsonb_build_object(
        'percentage', 25,
        'label', '25% of goal',
        'hit', v_total_stories >= (v_goal_target * 0.25),
        'shareCopy', 'We''ve reached 25% of our Teachers'' Signal goal!'
      ),
      jsonb_build_object(
        'percentage', 50,
        'label', '50% of goal',
        'hit', v_total_stories >= (v_goal_target * 0.50),
        'shareCopy', 'Halfway there! 50% of Alberta teachers have shared their signal.'
      ),
      jsonb_build_object(
        'percentage', 75,
        'label', '75% of goal',
        'hit', v_total_stories >= (v_goal_target * 0.75),
        'shareCopy', 'Momentum is building! 75% of our Teachers'' Signal goal achieved.'
      ),
      jsonb_build_object(
        'percentage', 100,
        'label', '100% of goal',
        'hit', v_total_stories >= v_goal_target,
        'shareCopy', 'Victory! We''ve reached our Teachers'' Signal goal!'
      )
    );

    -- Build daily counts array from view
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', date,
        'count', count,
        'weekTotal', week_total
      ) ORDER BY date
    ) INTO v_daily_counts
    FROM metrics.daily_story_counts;

    -- Calculate streak statistics
    FOR v_prev_date IN
      SELECT date
      FROM metrics.daily_story_counts
      WHERE count > 0
      ORDER BY date
    LOOP
      IF v_streak_active THEN
        IF v_prev_date = CURRENT_DATE OR 
           v_prev_date = CURRENT_DATE - INTERVAL '1 day' THEN
          v_current_streak := v_current_streak + 1;
        ELSE
          v_streak_active := false;
          v_last_break := v_prev_date;
        END IF;
      END IF;
      
      v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
    END LOOP;

    -- Build streak summary
    v_streak := jsonb_build_object(
      'currentDays', v_current_streak,
      'longestDays', v_longest_streak,
      'lastBreak', v_last_break
    );

    -- Return results
    RETURN QUERY SELECT
      v_total_stories,
      v_coverage_pct,
      v_goal_target,
      ROUND((v_covered_divisions::numeric / v_total_divisions) * 100, 1) AS coverage_goal_pct,
      ROUND((v_total_stories::numeric / v_goal_target) * 100, 1) AS progress_pct,
      v_milestones,
      v_daily_counts,
      v_streak,
      now() AS last_updated;
  END;
END;
$$;

-- Grant access to authenticated and anonymous users
GRANT USAGE ON SCHEMA metrics TO anon, authenticated;
GRANT SELECT ON metrics.division_catalog TO anon, authenticated;
GRANT SELECT ON metrics.daily_story_counts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION metrics.get_teachers_signal_metrics() TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION metrics.get_teachers_signal_metrics() IS 
'Returns comprehensive Teachers'' Signal metrics including total stories, division coverage with n≥20 suppression, milestones, daily counts with weekly totals, streak statistics, and last update timestamp.';
