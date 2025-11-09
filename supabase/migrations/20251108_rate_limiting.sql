-- Rate limiting tables for Sybil resistance

-- Main rate limits table for device and user-based limiting
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_hash TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_submission TIMESTAMP WITH TIME ZONE NOT NULL,
  submission_type TEXT NOT NULL, -- 'signal', 'story', 'cci'
  submission_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ASN-based rate limiting table for network-level throttling
CREATE TABLE public.asn_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asn_identifier TEXT NOT NULL, -- Hashed ASN or network identifier
  device_hash TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_rate_limits_device_hash ON public.rate_limits(device_hash);
CREATE INDEX idx_rate_limits_user_id ON public.rate_limits(user_id);
CREATE INDEX idx_rate_limits_last_submission ON public.rate_limits(last_submission);
CREATE INDEX idx_asn_submissions_asn_identifier ON public.asn_submissions(asn_identifier);
CREATE INDEX idx_asn_submissions_submitted_at ON public.asn_submissions(submitted_at);
CREATE INDEX idx_asn_submissions_device_hash ON public.asn_submissions(device_hash);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asn_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limits
CREATE POLICY "Users can view own rate limit records"
ON public.rate_limits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
ON public.rate_limits
FOR ALL
USING (auth.role() = 'service_role');

-- RLS Policies for asn_submissions
CREATE POLICY "System can manage ASN submissions"
ON public.asn_submissions
FOR ALL
USING (auth.role() = 'service_role');

-- Function to clean up old rate limit records (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limits
  WHERE last_submission < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old ASN submissions (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_asn_submissions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.asn_submissions
  WHERE submitted_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on rate_limits
CREATE TRIGGER update_rate_limits_updated_at
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if a device can submit (used in RLS policies)
CREATE OR REPLACE FUNCTION can_device_submit(p_device_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_submission TIMESTAMP WITH TIME ZONE;
  v_count INTEGER;
BEGIN
  SELECT last_submission, submission_count
  INTO v_last_submission, v_count
  FROM public.rate_limits
  WHERE device_hash = p_device_hash;
  
  IF v_last_submission IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if 24 hours have passed since last submission
  IF v_last_submission < NOW() - INTERVAL '24 hours' THEN
    RETURN TRUE;
  END IF;
  
  -- Check daily limit (1 submission per 24 hours)
  IF v_count >= 1 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check ASN rate limit
CREATE OR REPLACE FUNCTION check_asn_rate_limit(p_asn_identifier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_device_count INTEGER;
  v_max_devices INTEGER := 10; -- Max 10 devices per hour per ASN
BEGIN
  SELECT COUNT(DISTINCT device_hash)
  INTO v_device_count
  FROM public.asn_submissions
  WHERE asn_identifier = p_asn_identifier
  AND submitted_at >= NOW() - INTERVAL '1 hour';
  
  RETURN v_device_count < v_max_devices;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;