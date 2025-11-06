-- Create CCI submissions table
CREATE TABLE public.cci_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weekly_comparison TEXT NOT NULL CHECK (weekly_comparison IN ('better', 'same', 'worse')),
  satisfaction_10 INTEGER NOT NULL CHECK (satisfaction_10 >= 0 AND satisfaction_10 <= 10),
  exhaustion_10 INTEGER NOT NULL CHECK (exhaustion_10 >= 0 AND exhaustion_10 <= 10),
  district TEXT,
  role TEXT,
  tenure TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable Row Level Security
ALTER TABLE public.cci_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own CCI submissions"
ON public.cci_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id AND submission_date = CURRENT_DATE);

CREATE POLICY "Users can view own CCI submissions"
ON public.cci_submissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "CCI submissions are immutable (update)"
ON public.cci_submissions
FOR UPDATE
USING (false);

CREATE POLICY "CCI submissions are immutable (delete)"
ON public.cci_submissions
FOR DELETE
USING (false);

-- Create CCI aggregate function (diffusion index: 0-100, 50 = neutral)
CREATE OR REPLACE FUNCTION public.get_cci_aggregate(days_back INTEGER DEFAULT 7, min_n INTEGER DEFAULT 20)
RETURNS TABLE(
  cci NUMERIC,
  p_better NUMERIC,
  p_same NUMERIC,
  p_worse NUMERIC,
  total_n INTEGER,
  sat_mean NUMERIC,
  exh_mean NUMERIC,
  cci_change_1d NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_total INTEGER;
  prev_total INTEGER;
  prev_cci NUMERIC;
BEGIN
  -- Check if we have enough data
  SELECT COUNT(*)::INTEGER INTO current_total
  FROM public.cci_submissions
  WHERE submission_date >= CURRENT_DATE - days_back;

  IF current_total < min_n THEN
    RETURN;
  END IF;

  -- Calculate current period stats
  RETURN QUERY
  WITH current_stats AS (
    SELECT
      COUNT(*)::INTEGER as n,
      ROUND(AVG(CASE WHEN weekly_comparison = 'better' THEN 1 ELSE 0 END)::NUMERIC, 3) as p_better,
      ROUND(AVG(CASE WHEN weekly_comparison = 'same' THEN 1 ELSE 0 END)::NUMERIC, 3) as p_same,
      ROUND(AVG(CASE WHEN weekly_comparison = 'worse' THEN 1 ELSE 0 END)::NUMERIC, 3) as p_worse,
      ROUND(AVG(satisfaction_10)::NUMERIC, 1) as sat_mean,
      ROUND(AVG(exhaustion_10)::NUMERIC, 1) as exh_mean,
      MAX(created_at) as last_updated
    FROM public.cci_submissions
    WHERE submission_date >= CURRENT_DATE - days_back
  ),
  prev_stats AS (
    SELECT
      COUNT(*)::INTEGER as n,
      ROUND(AVG(CASE WHEN weekly_comparison = 'better' THEN 1 ELSE 0 END)::NUMERIC, 3) as p_better,
      ROUND(AVG(CASE WHEN weekly_comparison = 'worse' THEN 1 ELSE 0 END)::NUMERIC, 3) as p_worse
    FROM public.cci_submissions
    WHERE submission_date >= CURRENT_DATE - (days_back + 1) 
      AND submission_date < CURRENT_DATE - 1
  )
  SELECT
    ROUND(50 + 50 * (cs.p_better - cs.p_worse), 1) as cci,
    cs.p_better,
    cs.p_same,
    cs.p_worse,
    cs.n as total_n,
    cs.sat_mean,
    cs.exh_mean,
    CASE 
      WHEN ps.n >= min_n THEN 
        ROUND(50 + 50 * (cs.p_better - cs.p_worse), 1) - ROUND(50 + 50 * (ps.p_better - ps.p_worse), 1)
      ELSE NULL
    END as cci_change_1d,
    cs.last_updated
  FROM current_stats cs
  LEFT JOIN prev_stats ps ON true;
END;
$$;

-- Create daily CCI trend function (for sparkline)
CREATE OR REPLACE FUNCTION public.get_cci_daily_trend(days INTEGER DEFAULT 14, min_n INTEGER DEFAULT 20)
RETURNS TABLE(day DATE, cci NUMERIC, n INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      submission_date,
      COUNT(*)::INTEGER as n,
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
    n
  FROM daily_stats
  ORDER BY submission_date;
END;
$$;