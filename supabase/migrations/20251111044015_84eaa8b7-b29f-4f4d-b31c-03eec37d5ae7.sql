
-- Fix ambiguous column reference in get_cci_daily_trend
CREATE OR REPLACE FUNCTION public.get_cci_daily_trend(days integer DEFAULT 14, min_n integer DEFAULT 20)
RETURNS TABLE(day date, cci numeric, n integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      submission_date,
      COUNT(*)::INTEGER as submission_count,
      ROUND(AVG(CASE WHEN weekly_comparison = 'better' THEN 1 ELSE 0 END)::NUMERIC, 3) as p_better,
      ROUND(AVG(CASE WHEN weekly_comparison = 'worse' THEN 1 ELSE 0 END)::NUMERIC, 3) as p_worse
    FROM public.cci_submissions
    WHERE submission_date >= CURRENT_DATE - (days - 1)
    GROUP BY submission_date
    HAVING COUNT(*) >= min_n
  )
  SELECT
    submission_date as day,
    ROUND(50 + 50 * (p_better - p_worse), 1) as cci,
    submission_count as n
  FROM daily_stats
  ORDER BY submission_date;
END;
$$;
