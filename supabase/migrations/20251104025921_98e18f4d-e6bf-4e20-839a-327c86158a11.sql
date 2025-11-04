-- Velocity: 14-day daily counts
CREATE OR REPLACE FUNCTION public.get_campaign_daily_counts(c_key text, days integer DEFAULT 14)
RETURNS TABLE(day date, count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.validate_campaign_key(c_key);
  RETURN QUERY
  WITH d AS (
    SELECT generate_series(CURRENT_DATE - (days - 1), CURRENT_DATE, '1 day')::date AS day
  )
  SELECT d.day,
         COALESCE((
           SELECT COUNT(*)::int
           FROM public.pledge_signatures ps
           JOIN public.campaigns c ON c.id = ps.campaign_id
           WHERE c.key = c_key AND ps.signed_at::date = d.day
         ), 0) AS count
  FROM d
  ORDER BY d.day;
END; $$;

-- Coverage: districts ≥ threshold vs observed
CREATE OR REPLACE FUNCTION public.get_campaign_coverage(c_key text)
RETURNS TABLE(covered integer, observed integer, ratio numeric, threshold integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE th integer;
BEGIN
  PERFORM public.validate_campaign_key(c_key);
  SELECT min_show_n INTO th FROM public.campaigns WHERE key = c_key AND active = true;
  RETURN QUERY
  WITH counts AS (
    SELECT COALESCE(ps.district,'') AS district, COUNT(*)::int AS c
    FROM public.pledge_signatures ps
    JOIN public.campaigns c ON c.id = ps.campaign_id
    WHERE c.key = c_key AND COALESCE(ps.district,'') <> ''
    GROUP BY 1
  )
  SELECT
    SUM( CASE WHEN c >= th THEN 1 ELSE 0 END )::int AS covered,
    COUNT(*)::int AS observed,
    CASE WHEN COUNT(*) = 0 THEN 0::numeric ELSE ROUND(SUM( CASE WHEN c >= th THEN 1 ELSE 0 END )::numeric / COUNT(*), 3) END AS ratio,
    th AS threshold
  FROM counts;
END; $$;

-- Poll distribution: Likert 1–5 (gated at n≥20)
CREATE OR REPLACE FUNCTION public.get_poll_distribution(_poll_id uuid, min_n integer DEFAULT 20)
RETURNS TABLE(score integer, count integer, total integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.micro_poll_responses WHERE poll_id = _poll_id) < min_n THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH t AS (
    SELECT response AS score, COUNT(*)::int AS cnt
    FROM public.micro_poll_responses
    WHERE poll_id = _poll_id
    GROUP BY response
  ),
  ttl AS (SELECT COUNT(*)::int AS n FROM public.micro_poll_responses WHERE poll_id = _poll_id)
  SELECT s.score,
         COALESCE(t.cnt, 0) AS count,
         ttl.n AS total
  FROM generate_series(1,5) AS s(score)
  LEFT JOIN t ON t.score = s.score
  CROSS JOIN ttl
  ORDER BY s.score;
END; $$;

-- Privacy Safeguard: ratio of suppressed slices
CREATE OR REPLACE FUNCTION public.get_privacy_safeguard_ratio(c_key text)
RETURNS TABLE(suppressed integer, visible integer, share_suppressed numeric, threshold integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE th integer;
BEGIN
  PERFORM public.validate_campaign_key(c_key);
  SELECT min_show_n INTO th FROM public.campaigns WHERE key = c_key AND active = true;

  RETURN QUERY
  WITH counts AS (
    SELECT COALESCE(ps.district,'') AS district, COUNT(*)::int AS c
    FROM public.pledge_signatures ps
    JOIN public.campaigns c ON c.id = ps.campaign_id
    WHERE c.key = c_key AND COALESCE(ps.district,'') <> ''
    GROUP BY 1
  )
  SELECT
    SUM( CASE WHEN c > 0 AND c < th THEN 1 ELSE 0 END )::int AS suppressed,
    SUM( CASE WHEN c >= th THEN 1 ELSE 0 END )::int AS visible,
    CASE WHEN SUM( CASE WHEN c > 0 THEN 1 ELSE 0 END ) = 0
         THEN 0::numeric
         ELSE ROUND(SUM( CASE WHEN c > 0 AND c < th THEN 1 ELSE 0 END )::numeric
                    / SUM( CASE WHEN c > 0 THEN 1 ELSE 0 END ), 3)
    END AS share_suppressed,
    th AS threshold;
END; $$;