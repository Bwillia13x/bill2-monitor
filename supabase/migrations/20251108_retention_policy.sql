-- Data retention and cleanup infrastructure

-- Add deleted flags to existing tables
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

ALTER TABLE public.story_videos ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE public.story_videos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.story_videos ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Story backups table for retention compliance
CREATE TABLE public.story_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  backup_type TEXT NOT NULL, -- 'retention_cleanup', 'manual', 'scheduled'
  story_count INTEGER NOT NULL,
  backup_data JSONB NOT NULL,
  theme_aggregation JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Aggregated theme storage for long-term analysis
CREATE TABLE public.aggregated_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme TEXT NOT NULL,
  count INTEGER NOT NULL,
  avg_confidence REAL NOT NULL,
  districts TEXT[] DEFAULT '{}',
  roles TEXT[] DEFAULT '{}',
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  sample_keywords TEXT[] DEFAULT '{}',
  alberta_specific BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cleanup logs for audit trail
CREATE TABLE public.cleanup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cleanup_type TEXT NOT NULL, -- 'stories', 'videos', 'signals', 'cci'
  items_deleted INTEGER NOT NULL,
  backup_created BOOLEAN DEFAULT false,
  backup_id UUID REFERENCES public.story_backups(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  retention_policy JSONB NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_stories_deleted_created ON public.stories(deleted, created_at);
CREATE INDEX idx_story_videos_deleted_created ON public.story_videos(deleted, created_at);
CREATE INDEX idx_story_backups_backup_date ON public.story_backups(backup_date DESC);
CREATE INDEX idx_aggregated_themes_theme_date ON public.aggregated_themes(theme, date_range_start);
CREATE INDEX idx_aggregated_themes_created ON public.aggregated_themes(created_at DESC);
CREATE INDEX idx_cleanup_logs_status ON public.cleanup_logs(status, started_at DESC);

-- Enable RLS
ALTER TABLE public.story_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregated_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "System can manage story backups"
ON public.story_backups
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view story backups"
ON public.story_backups
FOR SELECT
USING (auth.has_role('admin'));

CREATE POLICY "System can manage aggregated themes"
ON public.aggregated_themes
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view aggregated themes"
ON public.aggregated_themes
FOR SELECT
USING (auth.has_role('admin'));

CREATE POLICY "System can manage cleanup logs"
ON public.cleanup_logs
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view cleanup logs"
ON public.cleanup_logs
FOR SELECT
USING (auth.has_role('admin'));

-- Update existing RLS policies to exclude deleted content
DROP POLICY IF EXISTS "Public can view approved stories" ON public.stories;
CREATE POLICY "Public can view approved stories"
ON public.stories
FOR SELECT
USING (approved = true AND (deleted = false OR deleted IS NULL));

DROP POLICY IF EXISTS "Public can view approved story videos" ON public.story_videos;
CREATE POLICY "Public can view approved story videos"
ON public.story_videos
FOR SELECT
USING (approved = true AND (deleted = false OR deleted IS NULL));

-- Function to start cleanup job
CREATE OR REPLACE FUNCTION start_cleanup_job(p_cleanup_type TEXT)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_retention_policy JSONB;
BEGIN
  v_retention_policy := jsonb_build_object(
    'storyRetentionDays', 90,
    'videoRetentionDays', 180,
    'signalRetentionDays', 365,
    'cciRetentionDays', 730,
    'aggregationEnabled', true,
    'backupEnabled', true
  );

  INSERT INTO public.cleanup_logs (cleanup_type, items_deleted, retention_policy)
  VALUES (p_cleanup_type, 0, v_retention_policy)
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete cleanup job
CREATE OR REPLACE FUNCTION complete_cleanup_job(
  p_job_id UUID,
  p_items_deleted INTEGER,
  p_backup_created BOOLEAN,
  p_backup_id UUID DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.cleanup_logs
  SET 
    items_deleted = p_items_deleted,
    backup_created = p_backup_created,
    backup_id = p_backup_id,
    completed_at = NOW(),
    status = CASE WHEN p_error_message IS NULL THEN 'completed' ELSE 'failed' END,
    error_message = p_error_message
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store aggregated theme data
CREATE OR REPLACE FUNCTION store_aggregated_themes(p_themes JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_theme JSONB;
BEGIN
  FOR v_theme IN SELECT * FROM jsonb_array_elements(p_themes)
  LOOP
    INSERT INTO public.aggregated_themes (
      theme,
      count,
      avg_confidence,
      districts,
      roles,
      date_range_start,
      date_range_end,
      sample_keywords,
      alberta_specific
    )
    VALUES (
      v_theme->>'theme',
      (v_theme->>'count')::INTEGER,
      (v_theme->>'avgConfidence')::REAL,
      ARRAY(SELECT jsonb_array_elements_text(v_theme->'districts')),
      ARRAY(SELECT jsonb_array_elements_text(v_theme->'roles')),
      (v_theme->>'dateRangeStart')::DATE,
      (v_theme->>'dateRangeEnd')::DATE,
      ARRAY(SELECT jsonb_array_elements_text(v_theme->'sampleKeywords')),
      (v_theme->>'albertaSpecific')::BOOLEAN
    );
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;
  
  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get retention statistics
CREATE OR REPLACE FUNCTION get_retention_stats()
RETURNS TABLE (
  stories_eligible INTEGER,
  videos_eligible INTEGER,
  signals_eligible INTEGER,
  cci_eligible INTEGER,
  next_cleanup TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE s.created_at < NOW() - INTERVAL '90 days')::INTEGER,
    COUNT(*) FILTER (WHERE v.created_at < NOW() - INTERVAL '180 days')::INTEGER,
    COUNT(*) FILTER (WHERE sig.created_at < NOW() - INTERVAL '365 days')::INTEGER,
    COUNT(*) FILTER (WHERE cci.created_at < NOW() - INTERVAL '730 days')::INTEGER,
    (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '2 hours')::TIMESTAMP WITH TIME ZONE;
  FROM public.stories s, public.story_videos v, public.signals sig, public.cci_submissions cci;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old rate limit records (called by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limits
  WHERE last_submission < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old ASN submissions (called by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_asn_submissions()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.asn_submissions
  WHERE submitted_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_aggregated_themes_updated_at
BEFORE UPDATE ON public.aggregated_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- View for retention compliance reporting
CREATE VIEW public.retention_compliance_report AS
SELECT 
  'stories' as data_type,
  COUNT(*) FILTER (WHERE deleted = false) as active_count,
  COUNT(*) FILTER (WHERE deleted = true) as deleted_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record,
  AVG(EXTRACT(DAYS FROM (NOW() - created_at))) as avg_age_days
FROM public.stories

UNION ALL

SELECT 
  'story_videos' as data_type,
  COUNT(*) FILTER (WHERE deleted = false) as active_count,
  COUNT(*) FILTER (WHERE deleted = true) as deleted_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record,
  AVG(EXTRACT(DAYS FROM (NOW() - created_at))) as avg_age_days
FROM public.story_videos

UNION ALL

SELECT 
  'signals' as data_type,
  COUNT(*) as active_count,
  0 as deleted_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record,
  AVG(EXTRACT(DAYS FROM (NOW() - created_at))) as avg_age_days
FROM public.signals

UNION ALL

SELECT 
  'cci_submissions' as data_type,
  COUNT(*) as active_count,
  0 as deleted_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record,
  AVG(EXTRACT(DAYS FROM (NOW() - created_at))) as avg_age_days
FROM public.cci_submissions;