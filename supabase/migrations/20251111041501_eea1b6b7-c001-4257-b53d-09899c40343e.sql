-- Create snapshot_logs table for tracking automated snapshots
CREATE TABLE IF NOT EXISTS public.snapshot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id TEXT NOT NULL UNIQUE,
  snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_records INTEGER NOT NULL,
  data_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_snapshot_logs_timestamp ON public.snapshot_logs(snapshot_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_snapshot_logs_status ON public.snapshot_logs(status);

-- Enable RLS
ALTER TABLE public.snapshot_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to snapshot logs for transparency
CREATE POLICY "Anyone can read snapshot logs"
ON public.snapshot_logs
FOR SELECT
USING (true);

-- Create error_logs table for tracking system errors
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  error_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs(error_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON public.error_logs(error_type);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read error logs
CREATE POLICY "Admins can read error logs"
ON public.error_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Function to get latest snapshot info
CREATE OR REPLACE FUNCTION public.get_latest_snapshot_info()
RETURNS TABLE(
  snapshot_id TEXT,
  snapshot_timestamp TIMESTAMPTZ,
  total_records INTEGER,
  data_hash TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.snapshot_id,
    sl.snapshot_timestamp,
    sl.total_records,
    sl.data_hash,
    sl.status
  FROM public.snapshot_logs sl
  WHERE sl.status = 'success'
  ORDER BY sl.snapshot_timestamp DESC
  LIMIT 1;
END;
$$;