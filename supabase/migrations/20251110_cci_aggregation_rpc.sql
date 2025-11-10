-- Create RPC function for CCI aggregation with n≥20 suppression
-- This function implements privacy-preserving aggregation at multiple levels

CREATE OR REPLACE FUNCTION get_cci_aggregate(
  p_district TEXT DEFAULT NULL,
  p_tenure TEXT DEFAULT NULL,
  p_subject TEXT DEFAULT NULL,
  p_min_n INTEGER DEFAULT 20
)
RETURNS TABLE (
  district TEXT,
  tenure TEXT,
  subject TEXT,
  n_signals INTEGER,
  avg_cci NUMERIC,
  ci_lower NUMERIC,
  ci_upper NUMERIC,
  suppressed BOOLEAN,
  aggregation_level TEXT
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Level 1: Try most specific (district + tenure + subject)
  IF p_district IS NOT NULL AND p_tenure IS NOT NULL AND p_subject IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM cci_submissions
    WHERE 
      (p_district IS NULL OR cci_submissions.district = p_district)
      AND (p_tenure IS NULL OR cci_submissions.tenure = p_tenure)
      AND (p_subject IS NULL OR cci_submissions.subject = p_subject);
    
    IF v_count >= p_min_n THEN
      RETURN QUERY
      SELECT 
        p_district as district,
        p_tenure as tenure,
        p_subject as subject,
        v_count as n_signals,
        ROUND(AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion)))::NUMERIC, 1) as avg_cci,
        ROUND((AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) - 
               1.96 * STDDEV(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) / SQRT(COUNT(*)))::NUMERIC, 1) as ci_lower,
        ROUND((AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) + 
               1.96 * STDDEV(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) / SQRT(COUNT(*)))::NUMERIC, 1) as ci_upper,
        false as suppressed,
        'district_tenure_subject' as aggregation_level
      FROM cci_submissions
      WHERE 
        cci_submissions.district = p_district
        AND cci_submissions.tenure = p_tenure
        AND cci_submissions.subject = p_subject;
      RETURN;
    END IF;
  END IF;
  
  -- Level 2: Try district + tenure (suppress subject)
  IF p_district IS NOT NULL AND p_tenure IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM cci_submissions
    WHERE 
      cci_submissions.district = p_district
      AND cci_submissions.tenure = p_tenure;
    
    IF v_count >= p_min_n THEN
      RETURN QUERY
      SELECT 
        p_district as district,
        p_tenure as tenure,
        NULL::TEXT as subject,
        v_count as n_signals,
        ROUND(AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion)))::NUMERIC, 1) as avg_cci,
        ROUND((AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) - 
               1.96 * STDDEV(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) / SQRT(COUNT(*)))::NUMERIC, 1) as ci_lower,
        ROUND((AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) + 
               1.96 * STDDEV(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) / SQRT(COUNT(*)))::NUMERIC, 1) as ci_upper,
        false as suppressed,
        'district_tenure' as aggregation_level
      FROM cci_submissions
      WHERE 
        cci_submissions.district = p_district
        AND cci_submissions.tenure = p_tenure;
      RETURN;
    END IF;
  END IF;
  
  -- Level 3: Try district only (suppress tenure and subject)
  IF p_district IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM cci_submissions
    WHERE cci_submissions.district = p_district;
    
    IF v_count >= p_min_n THEN
      RETURN QUERY
      SELECT 
        p_district as district,
        NULL::TEXT as tenure,
        NULL::TEXT as subject,
        v_count as n_signals,
        ROUND(AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion)))::NUMERIC, 1) as avg_cci,
        ROUND((AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) - 
               1.96 * STDDEV(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) / SQRT(COUNT(*)))::NUMERIC, 1) as ci_lower,
        ROUND((AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) + 
               1.96 * STDDEV(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) / SQRT(COUNT(*)))::NUMERIC, 1) as ci_upper,
        false as suppressed,
        'district' as aggregation_level
      FROM cci_submissions
      WHERE cci_submissions.district = p_district;
      RETURN;
    END IF;
  END IF;
  
  -- Level 4: Suppressed - return NULL with suppression flag
  RETURN QUERY
  SELECT 
    p_district as district,
    p_tenure as tenure,
    p_subject as subject,
    v_count as n_signals,
    NULL::NUMERIC as avg_cci,
    NULL::NUMERIC as ci_lower,
    NULL::NUMERIC as ci_upper,
    true as suppressed,
    'suppressed' as aggregation_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all district aggregates (for daily signing)
CREATE OR REPLACE FUNCTION get_all_district_aggregates(
  p_date DATE DEFAULT CURRENT_DATE,
  p_min_n INTEGER DEFAULT 20
)
RETURNS TABLE (
  district TEXT,
  n_signals INTEGER,
  avg_cci NUMERIC,
  ci_lower NUMERIC,
  ci_upper NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.district,
    COUNT(*)::INTEGER as n_signals,
    ROUND(AVG(10 * (0.4 * s.job_satisfaction + 0.6 * (10 - s.work_exhaustion)))::NUMERIC, 1) as avg_cci,
    ROUND((AVG(10 * (0.4 * s.job_satisfaction + 0.6 * (10 - s.work_exhaustion))) - 
           1.96 * STDDEV(10 * (0.4 * s.job_satisfaction + 0.6 * (10 - s.work_exhaustion))) / SQRT(COUNT(*)))::NUMERIC, 1) as ci_lower,
    ROUND((AVG(10 * (0.4 * s.job_satisfaction + 0.6 * (10 - s.work_exhaustion))) + 
           1.96 * STDDEV(10 * (0.4 * s.job_satisfaction + 0.6 * (10 - s.work_exhaustion))) / SQRT(COUNT(*)))::NUMERIC, 1) as ci_upper
  FROM cci_submissions s
  WHERE DATE(s.created_at) = p_date
  GROUP BY s.district
  HAVING COUNT(*) >= p_min_n
  ORDER BY s.district;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get province-wide aggregate (for homepage)
CREATE OR REPLACE FUNCTION get_province_aggregate(
  p_days_back INTEGER DEFAULT 30,
  p_min_n INTEGER DEFAULT 20
)
RETURNS TABLE (
  n_signals INTEGER,
  avg_cci NUMERIC,
  ci_lower NUMERIC,
  ci_upper NUMERIC,
  districts_covered INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as n_signals,
    ROUND(AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion)))::NUMERIC, 1) as avg_cci,
    ROUND((AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) - 
           1.96 * STDDEV(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) / SQRT(COUNT(*)))::NUMERIC, 1) as ci_lower,
    ROUND((AVG(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) + 
           1.96 * STDDEV(10 * (0.4 * job_satisfaction + 0.6 * (10 - work_exhaustion))) / SQRT(COUNT(*)))::NUMERIC, 1) as ci_upper,
    COUNT(DISTINCT district)::INTEGER as districts_covered
  FROM cci_submissions
  WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL
  HAVING COUNT(*) >= p_min_n;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get district status (for showing which districts are "locked")
CREATE OR REPLACE FUNCTION get_district_status(p_min_n INTEGER DEFAULT 20)
RETURNS TABLE (
  district TEXT,
  n_signals INTEGER,
  is_locked BOOLEAN,
  last_submission TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.district,
    COUNT(s.id)::INTEGER as n_signals,
    COUNT(s.id) < p_min_n as is_locked,
    MAX(s.created_at) as last_submission
  FROM (
    SELECT DISTINCT district FROM cci_submissions
  ) d
  LEFT JOIN cci_submissions s ON d.district = s.district
  GROUP BY d.district
  ORDER BY n_signals DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to calculate CCI from satisfaction and exhaustion
CREATE OR REPLACE FUNCTION calculate_cci(
  p_satisfaction NUMERIC,
  p_exhaustion NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND((10 * (0.4 * p_satisfaction + 0.6 * (10 - p_exhaustion)))::NUMERIC, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_cci_aggregate TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_district_aggregates TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_province_aggregate TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_district_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_cci TO anon, authenticated;
