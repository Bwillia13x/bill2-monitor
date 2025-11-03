-- Add input validation CHECK constraints for user-generated text fields

-- 1. Add length constraints to pledge_signatures table
ALTER TABLE public.pledge_signatures 
ADD CONSTRAINT one_liner_length_check 
CHECK (one_liner IS NULL OR char_length(one_liner) <= 120);

ALTER TABLE public.pledge_signatures 
ADD CONSTRAINT district_length_check 
CHECK (district IS NULL OR char_length(district) <= 100);

-- 2. Add length constraint to one_liners.district for consistency
ALTER TABLE public.one_liners 
ADD CONSTRAINT district_length_check 
CHECK (district IS NULL OR char_length(district) <= 100);

-- 3. Add length constraint to stories.district for consistency  
ALTER TABLE public.stories 
ADD CONSTRAINT district_length_check 
CHECK (district IS NULL OR char_length(district) <= 100);

-- 4. Create input validation function for c_key parameters
-- This validates campaign keys used in SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.validate_campaign_key(c_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate c_key format: alphanumeric and underscores only, max 50 chars
  IF c_key IS NULL OR 
     char_length(c_key) > 50 OR 
     c_key !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid campaign key format';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 5. Update get_campaign_summary to use validation
CREATE OR REPLACE FUNCTION public.get_campaign_summary(c_key text)
 RETURNS TABLE(total integer, today integer, min_show_n integer, statement text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate input
  PERFORM public.validate_campaign_key(c_key);
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM pledge_signatures ps
      JOIN campaigns c ON c.id = ps.campaign_id 
      WHERE c.key = c_key) as total,
    (SELECT COUNT(*)::INTEGER FROM pledge_signatures ps
      JOIN campaigns c ON c.id = ps.campaign_id 
      WHERE c.key = c_key AND ps.signed_at::date = CURRENT_DATE) as today,
    c.min_show_n,
    c.statement
  FROM campaigns c
  WHERE c.key = c_key AND c.active = true;
END;
$function$;

-- 6. Update get_campaign_districts to use validation
CREATE OR REPLACE FUNCTION public.get_campaign_districts(c_key text)
 RETURNS TABLE(district text, count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  threshold INTEGER;
BEGIN
  -- Validate input
  PERFORM public.validate_campaign_key(c_key);
  
  SELECT min_show_n INTO threshold FROM campaigns WHERE key = c_key;
  
  RETURN QUERY
  SELECT 
    ps.district,
    COUNT(*)::INTEGER as count
  FROM pledge_signatures ps
  JOIN campaigns c ON c.id = ps.campaign_id
  WHERE c.key = c_key 
    AND COALESCE(ps.district, '') <> ''
  GROUP BY ps.district
  HAVING COUNT(*) >= threshold
  ORDER BY COUNT(*) DESC;
END;
$function$;

-- 7. Update has_user_signed to use validation
CREATE OR REPLACE FUNCTION public.has_user_signed(c_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate input
  PERFORM public.validate_campaign_key(c_key);
  
  RETURN EXISTS (
    SELECT 1 FROM pledge_signatures ps
    JOIN campaigns c ON c.id = ps.campaign_id
    WHERE c.key = c_key AND ps.user_id = auth.uid()
  );
END;
$function$;