-- Add schema and metrics artefacts for the Teachers' Signal hero visuals

CREATE SCHEMA IF NOT EXISTS metrics;

-- Catalog of divisions we're tracking for coverage progress
CREATE TABLE IF NOT EXISTS metrics.division_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO metrics.division_catalog (id, name, region, threshold) VALUES
  ('edmonton-public', 'Edmonton Public Schools', 'edmonton', 20),
  ('edmonton-catholic', 'Edmonton Catholic Schools', 'edmonton', 20),
  ('st-albert-public', 'St. Albert Public Schools', 'edmonton', 20),
  ('calgary-board', 'Calgary Board of Education', 'calgary', 20),
  ('calgary-catholic', 'Calgary Catholic School District', 'calgary', 20),
  ('red-deer-public', 'Red Deer Public Schools', 'central', 20),
  ('red-deer-catholic', 'Red Deer Catholic Regional Schools', 'central', 20),
  ('rocky-view', 'Rocky View Schools', 'central', 20),
  ('chinooks-edge', 'Chinook''s Edge School Division', 'central', 20),
  ('wolf-creek', 'Wolf Creek Public Schools', 'central', 20),
  ('lethbridge', 'Lethbridge School District', 'south', 20),
  ('holy-spirit', 'Holy Spirit Catholic Schools', 'south', 20),
  ('medicine-hat-public', 'Medicine Hat School District', 'south', 20),
  ('medicine-hat-catholic', 'Medicine Hat Catholic Board', 'south', 20),
  ('palliser', 'Palliser School Division', 'south', 20),
  ('fort-mcmurray', 'Fort McMurray Public Schools', 'north', 20),
  ('northland', 'Northland School Division', 'north', 20),
  ('high-prairie', 'High Prairie School Division', 'north', 20),
  ('fort-vermilion', 'Fort Vermilion School Division', 'north', 20),
  ('grande-prairie-public', 'Grande Prairie Public School District', 'north', 20),
  ('grande-prairie-catholic', 'Grande Prairie Catholic Schools', 'north', 20),
  ('livingstone-range', 'Livingstone Range School Division', 'south', 20),
  ('westwind', 'Westwind School Division', 'south', 20),
  ('francosud', 'FrancoSud', 'south', 20)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  region = EXCLUDED.region,
  threshold = EXCLUDED.threshold;

-- Daily counts view (365-day window) with weekly totals for privacy gating
CREATE OR REPLACE VIEW metrics.daily_story_counts AS
WITH base AS (
  SELECT
    date_trunc('day', created_at)::date AS day,
    COUNT(*)::INTEGER AS count
  FROM public.stories
  WHERE approved = true AND (deleted IS NULL OR deleted = false)
  GROUP BY day
),
calendar AS (
  SELECT generate_series(
    date_trunc('day', current_date - interval '364 days'),
    date_trunc('day', current_date),
    interval '1 day'
  )::date AS day
),
joined AS (
  SELECT
    c.day,
    COALESCE(b.count, 0)::INTEGER AS count
  FROM calendar c
  LEFT JOIN base b ON b.day = c.day
),
weekly AS (
  SELECT
    date_trunc('week', day)::date AS week_start,
    SUM(count)::INTEGER AS week_total
  FROM joined
  GROUP BY week_start
)
SELECT
  j.day,
  j.count,
  COALESCE(w.week_total, 0)::INTEGER AS week_total,
  w.week_start
FROM joined j
LEFT JOIN weekly w ON date_trunc('week', j.day) = w.week_start
ORDER BY j.day;

-- Aggregated metrics for the Teachers' Signal hero
CREATE OR REPLACE FUNCTION metrics.get_teachers_signal_metrics()
RETURNS TABLE (
  total_stories INTEGER,
  division_coverage_pct NUMERIC,
  goal_target INTEGER,
  coverage_goal_pct INTEGER,
  progress_pct NUMERIC,
  milestones JSONB,
  daily_counts JSONB,
  streak_summary JSONB,
  last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  goal INTEGER := 5000;
  coverage_goal INTEGER := 70;
  min_weekly INTEGER := 20;
  milestone_percentages INTEGER[] := ARRAY[10, 25, 50, 75, 100];
  story_count INTEGER := 0;
  tracked_divisions INTEGER := 0;
  unlocked_divisions INTEGER := 0;
  coverage_pct NUMERIC := 0;
  progress_value NUMERIC := 0;
  row RECORD;
  current_streak INTEGER := 0;
  longest_streak INTEGER := 0;
  last_break_date DATE := NULL;
  milestone_data JSONB := '[]'::JSONB;
  daily_data JSONB := '[]'::JSONB;
  streak_data JSONB := '[]'::JSONB;
  last_update TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT COUNT(*) INTO story_count
  FROM public.stories
  WHERE approved = true AND (deleted IS NULL OR deleted = false);

  SELECT COUNT(*) INTO tracked_divisions FROM metrics.division_catalog;

  SELECT COUNT(*) INTO unlocked_divisions
  FROM metrics.division_catalog dc
  LEFT JOIN (
    SELECT lower(district) AS district_key, COUNT(*) AS cnt
    FROM public.stories
    WHERE approved = true AND (deleted IS NULL OR deleted = false) AND district IS NOT NULL
    GROUP BY lower(district)
  ) sc ON sc.district_key = lower(dc.name)
  WHERE COALESCE(sc.cnt, 0) >= dc.threshold;

  IF tracked_divisions > 0 THEN
    coverage_pct := ROUND((unlocked_divisions::NUMERIC / tracked_divisions::NUMERIC) * 100, 2);
  ELSE
    coverage_pct := 0;
  END IF;

  IF goal > 0 THEN
    progress_value := LEAST(ROUND((story_count::NUMERIC / goal::NUMERIC) * 100, 2), 100);
  ELSE
    progress_value := 0;
  END IF;

  SELECT COALESCE(MAX(created_at), NOW()) INTO last_update
  FROM public.stories
  WHERE approved = true AND (deleted IS NULL OR deleted = false);

  SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'date', to_char(day, 'YYYY-MM-DD'),
        'count', CASE WHEN week_total >= min_weekly THEN count ELSE NULL END,
        'weekTotal', week_total
      ) ORDER BY day
    ), '[]'::jsonb) INTO daily_data
  FROM metrics.daily_story_counts;

  FOR row IN
    SELECT day, count
    FROM metrics.daily_story_counts
    ORDER BY day
  LOOP
    IF row.count > 0 THEN
      current_streak := current_streak + 1;
      IF current_streak > longest_streak THEN
        longest_streak := current_streak;
      END IF;
    ELSE
      last_break_date := row.day;
      current_streak := 0;
    END IF;
  END LOOP;

  streak_data := jsonb_build_object(
    'currentDays', current_streak,
    'longestDays', longest_streak,
    'lastBreak', CASE WHEN last_break_date IS NOT NULL THEN to_char(last_break_date, 'YYYY-MM-DD') ELSE NULL END
  );

  SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'percentage', pct,
        'label', format('%s%% of goal', pct),
        'hit', progress_value >= pct,
        'shareCopy', format('Teachers'' Signal has reached %s%% of the %s-story goal!', pct, goal)
      ) ORDER BY pct
    ), '[]'::jsonb) INTO milestone_data
  FROM unnest(milestone_percentages) AS pct;

  RETURN QUERY
  SELECT
    story_count,
    coverage_pct,
    goal,
    coverage_goal,
    progress_value,
    milestone_data,
    daily_data,
    streak_data,
    last_update;
END;
$$;
