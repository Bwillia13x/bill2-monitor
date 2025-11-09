-- Anonymous token system for personal dashboards

-- Anonymous tokens table
CREATE TABLE public.anonymous_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_agent TEXT,
  ip_hash TEXT, -- Hashed for privacy
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Token submissions association table
CREATE TABLE public.token_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL REFERENCES public.anonymous_tokens(token) ON DELETE CASCADE,
  submission_id TEXT NOT NULL,
  submission_type TEXT NOT NULL, -- 'signal', 'story', 'cci'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_anonymous_tokens_token ON public.anonymous_tokens(token);
CREATE INDEX idx_anonymous_tokens_expires ON public.anonymous_tokens(expires_at);
CREATE INDEX idx_token_submissions_token ON public.token_submissions(token);
CREATE INDEX idx_token_submissions_submission ON public.token_submissions(submission_id, submission_type);
CREATE INDEX idx_token_submissions_created ON public.token_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE public.anonymous_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "System can manage anonymous tokens"
ON public.anonymous_tokens
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "System can manage token submissions"
ON public.token_submissions
FOR ALL
USING (auth.role() = 'service_role');

-- Function to cleanup expired tokens (called by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired tokens and their submissions (cascade)
  DELETE FROM public.anonymous_tokens
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update token last_used_at
CREATE OR REPLACE FUNCTION update_token_last_used(p_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.anonymous_tokens
  SET last_used_at = NOW()
  WHERE token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get token stats
CREATE OR REPLACE FUNCTION get_token_stats(p_token TEXT)
RETURNS TABLE (
  total_submissions INTEGER,
  first_submission TIMESTAMP WITH TIME ZONE,
  last_submission TIMESTAMP WITH TIME ZONE,
  submission_types TEXT[],
  districts TEXT[],
  roles TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER,
    MIN(ts.created_at),
    MAX(ts.created_at),
    ARRAY_AGG(DISTINCT ts.submission_type),
    ARRAY_AGG(DISTINCT ts.metadata->>'district') FILTER (WHERE ts.metadata->>'district' IS NOT NULL),
    ARRAY_AGG(DISTINCT ts.metadata->>'role') FILTER (WHERE ts.metadata->>'role' IS NOT NULL)
  FROM public.token_submissions ts
  WHERE ts.token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for token activity summary
CREATE VIEW public.token_activity_summary AS
SELECT 
  token,
  COUNT(*) as total_submissions,
  MIN(created_at) as first_submission,
  MAX(created_at) as last_submission,
  COUNT(*) FILTER (WHERE submission_type = 'signal') as signal_count,
  COUNT(*) FILTER (WHERE submission_type = 'story') as story_count,
  COUNT(*) FILTER (WHERE submission_type = 'cci') as cci_count
FROM public.token_submissions
GROUP BY token
ORDER BY last_submission DESC;

-- View for expired tokens
CREATE VIEW public.expired_tokens AS
SELECT 
  *,
  NOW() - expires_at as time_expired
FROM public.anonymous_tokens
WHERE expires_at < NOW()
ORDER BY expires_at DESC;