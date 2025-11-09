-- Snapshot automation system tables

-- Snapshot generation logs
CREATE TABLE public.snapshot_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  version TEXT NOT NULL,
  total_hash TEXT NOT NULL,
  file_count INTEGER NOT NULL,
  total_records INTEGER NOT NULL,
  geographic_coverage INTEGER NOT NULL,
  manifest JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT
);

-- Error logs for snapshot generation
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT
);

-- Stakeholder notifications
CREATE TABLE public.snapshot_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  recipient_type TEXT NOT NULL, -- 'advisory_board', 'media', 'research_partner', 'admin'
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered BOOLEAN DEFAULT false,
  opened BOOLEAN DEFAULT false,
  error_message TEXT
);

-- Storage bucket for snapshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'snapshots',
  'snapshots',
  true,
  52428800, -- 50MB limit
  ARRAY['text/csv', 'application/json', 'text/plain', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_snapshot_logs_timestamp ON public.snapshot_logs(timestamp DESC);
CREATE INDEX idx_snapshot_logs_total_hash ON public.snapshot_logs(total_hash);
CREATE INDEX idx_error_logs_timestamp ON public.error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_type ON public.error_logs(error_type);
CREATE INDEX idx_snapshot_notifications_timestamp ON public.snapshot_notifications(snapshot_timestamp DESC);
CREATE INDEX idx_snapshot_notifications_recipient ON public.snapshot_notifications(recipient_email);

-- Enable RLS
ALTER TABLE public.snapshot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshot_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "System can manage snapshot logs"
ON public.snapshot_logs
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view snapshot logs"
ON public.snapshot_logs
FOR SELECT
USING (auth.has_role('admin'));

CREATE POLICY "System can manage error logs"
ON public.error_logs
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view error logs"
ON public.error_logs
FOR SELECT
USING (auth.has_role('admin'));

CREATE POLICY "System can manage notifications"
ON public.snapshot_notifications
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view notifications"
ON public.snapshot_notifications
FOR SELECT
USING (auth.has_role('admin'));

-- Storage policies for snapshots bucket
CREATE POLICY "Public can view snapshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'snapshots');

CREATE POLICY "Service role can manage snapshots"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'snapshots' AND 
  auth.role() = 'service_role'
);

-- Function to get latest snapshot info
CREATE OR REPLACE FUNCTION get_latest_snapshot_info()
RETURNS TABLE (
  timestamp TIMESTAMP WITH TIME ZONE,
  version TEXT,
  total_hash TEXT,
  file_count INTEGER,
  total_records INTEGER,
  geographic_coverage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.timestamp,
    s.version,
    s.total_hash,
    s.file_count,
    s.total_records,
    s.geographic_coverage
  FROM public.snapshot_logs s
  WHERE s.error_message IS NULL
  ORDER BY s.timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get snapshot history
CREATE OR REPLACE FUNCTION get_snapshot_history(days_back INTEGER DEFAULT 90)
RETURNS TABLE (
  timestamp TIMESTAMP WITH TIME ZONE,
  version TEXT,
  total_hash TEXT,
  file_count INTEGER,
  total_records INTEGER,
  geographic_coverage INTEGER,
  success BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.timestamp,
    s.version,
    s.total_hash,
    s.file_count,
    s.total_records,
    s.geographic_coverage,
    s.error_message IS NULL as success
  FROM public.snapshot_logs s
  WHERE s.timestamp >= NOW() - (days_back || ' days')::INTERVAL
  ORDER BY s.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  error_type TEXT,
  error_count INTEGER,
  first_occurrence TIMESTAMP WITH TIME ZONE,
  last_occurrence TIMESTAMP WITH TIME ZONE,
  resolved_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.error_type,
    COUNT(*)::INTEGER,
    MIN(e.timestamp),
    MAX(e.timestamp),
    COUNT(*) FILTER (WHERE e.resolved = true)::INTEGER
  FROM public.error_logs e
  WHERE e.timestamp >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY e.error_type
  ORDER BY error_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark error as resolved
CREATE OR REPLACE FUNCTION resolve_error(p_error_id UUID, p_resolution_notes TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.error_logs
  SET 
    resolved = true,
    resolution_notes = p_resolution_notes,
    resolution_timestamp = NOW()
  WHERE id = p_error_id;
END;
$$ LANGUAGE plgsql SECURITY DEFINER;

-- Function to record notification delivery
CREATE OR REPLACE FUNCTION record_notification_delivery(
  p_notification_id UUID,
  p_delivered BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.snapshot_notifications
  SET 
    delivered = p_delivered,
    error_message = p_error_message,
    delivery_confirmed_at = CASE WHEN p_delivered THEN NOW() ELSE NULL END
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for snapshot success rate
CREATE VIEW public.snapshot_success_rate AS
SELECT 
  DATE(timestamp) as snapshot_date,
  COUNT(*) FILTER (WHERE error_message IS NULL) as successful_snapshots,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) as failed_snapshots,
  COUNT(*) as total_snapshots,
  ROUND(
    (COUNT(*) FILTER (WHERE error_message IS NULL)::NUMERIC / COUNT(*)::NUMERIC) * 100,
    2
  ) as success_rate
FROM public.snapshot_logs
GROUP BY DATE(timestamp)
ORDER BY snapshot_date DESC;

-- View for error trends
CREATE VIEW public.error_trends AS
SELECT 
  DATE(timestamp) as error_date,
  error_type,
  COUNT(*) as error_count,
  COUNT(*) FILTER (WHERE resolved = true) as resolved_count
FROM public.error_logs
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), error_type
ORDER BY error_date DESC, error_count DESC;

-- Trigger for automatic error notification
CREATE OR REPLACE FUNCTION notify_snapshot_error()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.error_message IS NOT NULL THEN
    -- Insert notification record for admin
    INSERT INTO public.snapshot_notifications (
      snapshot_timestamp,
      recipient_type,
      recipient_email,
      error_message
    ) VALUES (
      NEW.timestamp,
      'admin',
      'admin@civicdataplatform.ca',
      NEW.error_message
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER snapshot_error_notification
AFTER INSERT ON public.snapshot_logs
FOR EACH ROW
EXECUTE FUNCTION notify_snapshot_error();

-- Cron job schedule (documented here, managed externally)
-- 0 2 * * 1 (Every Monday at 2:00 AM MST)
-- Command: npm run snapshot:weekly