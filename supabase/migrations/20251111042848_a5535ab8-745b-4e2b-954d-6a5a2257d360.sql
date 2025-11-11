
-- Create merkle_chain_events table if not exists
CREATE TABLE IF NOT EXISTS public.merkle_chain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB NOT NULL,
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merkle_chain_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read merkle events for verification
CREATE POLICY "Anyone can read merkle events" ON public.merkle_chain_events
  FOR SELECT USING (true);

-- Policy: No updates allowed (immutable)
CREATE POLICY "Merkle events are immutable" ON public.merkle_chain_events
  FOR UPDATE USING (false);

-- Policy: No deletes allowed (immutable)
CREATE POLICY "Merkle events cannot be deleted" ON public.merkle_chain_events
  FOR DELETE USING (false);

-- Create view for recent events (performance optimization)
CREATE OR REPLACE VIEW public.recent_merkle_events AS
SELECT event_id, event_type, timestamp, data, current_hash
FROM public.merkle_chain_events
ORDER BY timestamp DESC
LIMIT 1000;

-- Function: Get the current root hash of the merkle chain
CREATE OR REPLACE FUNCTION public.get_merkle_root_hash()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT current_hash
    FROM public.merkle_chain_events
    ORDER BY timestamp DESC
    LIMIT 1
  );
END;
$$;

-- Function: Add a new event to the merkle chain
CREATE OR REPLACE FUNCTION public.add_merkle_event(
  p_event_id TEXT,
  p_event_type TEXT,
  p_data JSONB,
  p_previous_hash TEXT,
  p_current_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  INSERT INTO public.merkle_chain_events (
    event_id,
    event_type,
    data,
    previous_hash,
    current_hash
  ) VALUES (
    p_event_id,
    p_event_type,
    p_data,
    p_previous_hash,
    p_current_hash
  )
  RETURNING jsonb_build_object(
    'event_id', event_id,
    'event_type', event_type,
    'timestamp', timestamp,
    'current_hash', current_hash
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function: Get merkle chain statistics
CREATE OR REPLACE FUNCTION public.get_merkle_chain_stats()
RETURNS TABLE(
  total_events INTEGER,
  root_hash TEXT,
  first_event_date TIMESTAMPTZ,
  last_event_date TIMESTAMPTZ,
  signals_submitted INTEGER,
  aggregates_updated INTEGER,
  snapshots_created INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_events,
    COALESCE(
      (SELECT current_hash FROM public.merkle_chain_events ORDER BY timestamp DESC LIMIT 1),
      ''
    ) as root_hash,
    MIN(timestamp) as first_event_date,
    MAX(timestamp) as last_event_date,
    COUNT(*) FILTER (WHERE event_type = 'signal_submitted')::INTEGER as signals_submitted,
    COUNT(*) FILTER (WHERE event_type = 'aggregate_updated')::INTEGER as aggregates_updated,
    COUNT(*) FILTER (WHERE event_type = 'snapshot_created')::INTEGER as snapshots_created
  FROM public.merkle_chain_events;
END;
$$;

-- Function: Verify the integrity of the merkle chain
CREATE OR REPLACE FUNCTION public.verify_merkle_chain()
RETURNS TABLE(
  is_valid BOOLEAN,
  total_events INTEGER,
  first_invalid_index INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_prev_hash TEXT := '';
  v_event RECORD;
  v_index INTEGER := 0;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count FROM public.merkle_chain_events;
  
  IF v_count = 0 THEN
    RETURN QUERY SELECT true, 0, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;
  
  FOR v_event IN 
    SELECT previous_hash, current_hash 
    FROM public.merkle_chain_events 
    ORDER BY timestamp ASC
  LOOP
    v_index := v_index + 1;
    
    IF v_index = 1 THEN
      v_prev_hash := v_event.current_hash;
      CONTINUE;
    END IF;
    
    IF v_event.previous_hash != v_prev_hash THEN
      RETURN QUERY SELECT false, v_count, v_index, 'Hash chain broken at index ' || v_index;
      RETURN;
    END IF;
    
    v_prev_hash := v_event.current_hash;
  END LOOP;
  
  RETURN QUERY SELECT true, v_count, NULL::INTEGER, NULL::TEXT;
END;
$$;

-- Function: Store digital signature
CREATE OR REPLACE FUNCTION public.store_digital_signature(
  p_data_type TEXT,
  p_data_id TEXT,
  p_signature TEXT,
  p_public_key TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.digital_signatures (
    data_type,
    data_id,
    signature,
    public_key,
    metadata
  ) VALUES (
    p_data_type,
    p_data_id,
    p_signature,
    p_public_key,
    p_metadata
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
