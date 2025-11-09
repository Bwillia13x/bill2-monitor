-- Moderation queue for content review workflow

-- Main moderation queue table
CREATE TABLE public.moderation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'story', 'story_video', 'one_liner'
  content_id UUID NOT NULL,
  content_text TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_score REAL NOT NULL DEFAULT 0.0,
  flags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  scan_result JSONB,
  content_metadata JSONB, -- Additional metadata like district, role, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_reason TEXT
);

-- Indexes for performance
CREATE INDEX idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX idx_moderation_queue_created_at ON public.moderation_queue(created_at DESC);
CREATE INDEX idx_moderation_queue_user_id ON public.moderation_queue(user_id);
CREATE INDEX idx_moderation_queue_content ON public.moderation_queue(content_type, content_id);
CREATE INDEX idx_moderation_queue_risk_score ON public.moderation_queue(risk_score DESC);
CREATE INDEX idx_moderation_queue_flags ON public.moderation_queue USING GIN(flags);

-- Enable RLS
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Moderators can view moderation queue"
ON public.moderation_queue
FOR SELECT
USING (auth.has_role('moderator') OR auth.has_role('admin'));

CREATE POLICY "Moderators can update moderation queue"
ON public.moderation_queue
FOR UPDATE
USING (auth.has_role('moderator') OR auth.has_role('admin'));

CREATE POLICY "System can manage moderation queue"
ON public.moderation_queue
FOR ALL
USING (auth.role() = 'service_role');

-- Function to automatically add content to moderation queue
CREATE OR REPLACE FUNCTION add_to_moderation_queue(
  p_content_type TEXT,
  p_content_id UUID,
  p_content_text TEXT,
  p_user_id UUID,
  p_scan_result JSONB,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO public.moderation_queue (
    content_type,
    content_id,
    content_text,
    user_id,
    risk_score,
    flags,
    status,
    scan_result,
    content_metadata
  ) VALUES (
    p_content_type,
    p_content_id,
    p_content_text,
    p_user_id,
    (p_scan_result->>'riskScore')::REAL,
    ARRAY(SELECT jsonb_array_elements_text(p_scan_result->'flags')),
    CASE 
      WHEN (p_scan_result->>'moderationAction') = 'auto_approve' THEN 'approved'
      WHEN (p_scan_result->>'moderationAction') = 'auto_reject' THEN 'rejected'
      ELSE 'pending'
    END,
    p_scan_result,
    p_metadata
  )
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get moderation statistics
CREATE OR REPLACE FUNCTION get_moderation_stats()
RETURNS TABLE (
  total_pending INTEGER,
  total_approved INTEGER,
  total_rejected INTEGER,
  high_risk_pending INTEGER,
  avg_review_time_hours REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER,
    COUNT(*) FILTER (WHERE status = 'approved')::INTEGER,
    COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER,
    COUNT(*) FILTER (WHERE status = 'pending' AND risk_score >= 0.7)::INTEGER,
    AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600.0)::REAL
  FROM public.moderation_queue
  WHERE reviewed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get moderation queue items with user info
CREATE OR REPLACE FUNCTION get_moderation_queue_with_user(
  p_status TEXT DEFAULT 'pending'
)
RETURNS TABLE (
  id UUID,
  content_type TEXT,
  content_id UUID,
  content_text TEXT,
  user_id UUID,
  risk_score REAL,
  flags TEXT[],
  status TEXT,
  scan_result JSONB,
  content_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  user_email TEXT,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mq.id,
    mq.content_type,
    mq.content_id,
    mq.content_text,
    mq.user_id,
    mq.risk_score,
    mq.flags,
    mq.status,
    mq.scan_result,
    mq.content_metadata,
    mq.created_at,
    u.email AS user_email,
    p.role AS user_role
  FROM public.moderation_queue mq
  LEFT JOIN auth.users u ON mq.user_id = u.id
  LEFT JOIN public.profiles p ON mq.user_id = p.id
  WHERE mq.status = p_status
  ORDER BY mq.risk_score DESC, mq.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_moderation_queue_updated_at
BEFORE UPDATE ON public.moderation_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- View for pending high-risk items
CREATE VIEW public.pending_high_risk_items AS
SELECT * FROM public.moderation_queue
WHERE status = 'pending' AND risk_score >= 0.7
ORDER BY created_at DESC;

-- View for moderation activity summary
CREATE VIEW public.moderation_activity_summary AS
SELECT 
  DATE(created_at) as review_date,
  status,
  COUNT(*) as count,
  AVG(risk_score) as avg_risk_score
FROM public.moderation_queue
WHERE reviewed_at IS NOT NULL
GROUP BY DATE(created_at), status
ORDER BY review_date DESC, status;