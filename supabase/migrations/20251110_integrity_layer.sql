-- Integrity Layer: Merkle Chain and Digital Signing Infrastructure
-- Implements tamper-evident event logging and cryptographic signing

-- Merkle Chain event log table
CREATE TABLE public.merkle_chain (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL CHECK (event_type IN ('signal_submitted', 'signal_validated', 'aggregate_updated', 'snapshot_created')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB NOT NULL,
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit log table for all database operations
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Digital signatures table for nightly signing
CREATE TABLE public.digital_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('daily_aggregate', 'weekly_snapshot', 'merkle_root')),
  signed_date DATE NOT NULL,
  data_hash TEXT NOT NULL,
  signature TEXT NOT NULL,
  public_key TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'Ed25519',
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Public key storage for verification
CREATE TABLE public.public_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_type TEXT NOT NULL CHECK (key_type IN ('master', 'backup', 'rotated')),
  public_key TEXT NOT NULL UNIQUE,
  algorithm TEXT NOT NULL DEFAULT 'Ed25519',
  active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_merkle_chain_event_id ON public.merkle_chain(event_id);
CREATE INDEX idx_merkle_chain_event_type ON public.merkle_chain(event_type);
CREATE INDEX idx_merkle_chain_timestamp ON public.merkle_chain(timestamp DESC);
CREATE INDEX idx_merkle_chain_current_hash ON public.merkle_chain(current_hash);

CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_operation ON public.audit_log(operation);
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);

CREATE INDEX idx_digital_signatures_type ON public.digital_signatures(signature_type);
CREATE INDEX idx_digital_signatures_date ON public.digital_signatures(signed_date DESC);
CREATE INDEX idx_digital_signatures_hash ON public.digital_signatures(data_hash);

CREATE INDEX idx_public_keys_active ON public.public_keys(active) WHERE active = true;
CREATE INDEX idx_public_keys_type ON public.public_keys(key_type);

-- Enable RLS
ALTER TABLE public.merkle_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merkle_chain (public read, system write)
CREATE POLICY "Anyone can view merkle chain"
ON public.merkle_chain
FOR SELECT
USING (true);

CREATE POLICY "System can manage merkle chain"
ON public.merkle_chain
FOR ALL
USING (auth.role() = 'service_role');

-- RLS Policies for audit_log (admins only)
CREATE POLICY "Admins can view audit log"
ON public.audit_log
FOR SELECT
USING (auth.has_role('admin'));

CREATE POLICY "System can manage audit log"
ON public.audit_log
FOR ALL
USING (auth.role() = 'service_role');

-- RLS Policies for digital_signatures (public read, system write)
CREATE POLICY "Anyone can view signatures"
ON public.digital_signatures
FOR SELECT
USING (true);

CREATE POLICY "System can manage signatures"
ON public.digital_signatures
FOR ALL
USING (auth.role() = 'service_role');

-- RLS Policies for public_keys (public read, system write)
CREATE POLICY "Anyone can view active public keys"
ON public.public_keys
FOR SELECT
USING (active = true);

CREATE POLICY "System can manage public keys"
ON public.public_keys
FOR ALL
USING (auth.role() = 'service_role');

-- Function to get the latest merkle chain root hash
CREATE OR REPLACE FUNCTION get_merkle_root_hash()
RETURNS TEXT AS $$
DECLARE
  v_root_hash TEXT;
BEGIN
  SELECT current_hash INTO v_root_hash
  FROM public.merkle_chain
  ORDER BY timestamp DESC
  LIMIT 1;
  
  RETURN COALESCE(v_root_hash, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify merkle chain integrity
CREATE OR REPLACE FUNCTION verify_merkle_chain()
RETURNS TABLE (
  is_valid BOOLEAN,
  total_events INTEGER,
  first_invalid_index INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_event RECORD;
  v_previous_event RECORD;
  v_first_invalid INTEGER := NULL;
  v_error TEXT := NULL;
  v_count INTEGER := 0;
BEGIN
  FOR v_event IN 
    SELECT * FROM public.merkle_chain ORDER BY timestamp ASC
  LOOP
    v_count := v_count + 1;
    
    -- Check first event has empty previous hash
    IF v_count = 1 AND v_event.previous_hash != '' THEN
      v_first_invalid := 0;
      v_error := 'First event must have empty previous hash';
      EXIT;
    END IF;
    
    -- Check chain linkage for subsequent events
    IF v_count > 1 THEN
      IF v_event.previous_hash != v_previous_event.current_hash THEN
        v_first_invalid := v_count - 1;
        v_error := 'Chain linkage broken at event ' || v_count;
        EXIT;
      END IF;
    END IF;
    
    v_previous_event := v_event;
  END LOOP;
  
  RETURN QUERY SELECT 
    (v_first_invalid IS NULL) as is_valid,
    v_count as total_events,
    v_first_invalid as first_invalid_index,
    v_error as error_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get merkle chain statistics
CREATE OR REPLACE FUNCTION get_merkle_chain_stats()
RETURNS TABLE (
  total_events INTEGER,
  root_hash TEXT,
  first_event_date TIMESTAMP WITH TIME ZONE,
  last_event_date TIMESTAMP WITH TIME ZONE,
  signals_submitted INTEGER,
  aggregates_updated INTEGER,
  snapshots_created INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_events,
    get_merkle_root_hash() as root_hash,
    MIN(timestamp) as first_event_date,
    MAX(timestamp) as last_event_date,
    COUNT(*) FILTER (WHERE event_type = 'signal_submitted')::INTEGER as signals_submitted,
    COUNT(*) FILTER (WHERE event_type = 'aggregate_updated')::INTEGER as aggregates_updated,
    COUNT(*) FILTER (WHERE event_type = 'snapshot_created')::INTEGER as snapshots_created
  FROM public.merkle_chain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add event to merkle chain
CREATE OR REPLACE FUNCTION add_merkle_event(
  p_event_id TEXT,
  p_event_type TEXT,
  p_data JSONB,
  p_previous_hash TEXT,
  p_current_hash TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.merkle_chain (
    event_id,
    event_type,
    timestamp,
    data,
    previous_hash,
    current_hash
  ) VALUES (
    p_event_id,
    p_event_type,
    NOW(),
    p_data,
    p_previous_hash,
    p_current_hash
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active public key
CREATE OR REPLACE FUNCTION get_active_public_key()
RETURNS TABLE (
  public_key TEXT,
  algorithm TEXT,
  valid_from TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pk.public_key,
    pk.algorithm,
    pk.valid_from
  FROM public.public_keys pk
  WHERE pk.active = true 
    AND pk.key_type = 'master'
    AND (pk.valid_until IS NULL OR pk.valid_until > NOW())
  ORDER BY pk.valid_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store digital signature
CREATE OR REPLACE FUNCTION store_digital_signature(
  p_signature_type TEXT,
  p_signed_date DATE,
  p_data_hash TEXT,
  p_signature TEXT,
  p_public_key TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.digital_signatures (
    signature_type,
    signed_date,
    data_hash,
    signature,
    public_key
  ) VALUES (
    p_signature_type,
    p_signed_date,
    p_data_hash,
    p_signature,
    p_public_key
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get signature for date
CREATE OR REPLACE FUNCTION get_signature_for_date(
  p_signature_type TEXT,
  p_date DATE
)
RETURNS TABLE (
  signature TEXT,
  data_hash TEXT,
  public_key TEXT,
  signed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.signature,
    ds.data_hash,
    ds.public_key,
    ds.signed_at
  FROM public.digital_signatures ds
  WHERE ds.signature_type = p_signature_type
    AND ds.signed_date = p_date
  ORDER BY ds.signed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, record_id, old_data)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), OLD.id, row_to_json(OLD)::JSONB);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, record_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), NEW.id, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, record_id, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), NEW.id, row_to_json(NEW)::JSONB);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old audit logs (older than 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_log
  WHERE timestamp < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for recent merkle chain events
CREATE VIEW public.recent_merkle_events AS
SELECT 
  event_id,
  event_type,
  timestamp,
  data,
  current_hash,
  created_at
FROM public.merkle_chain
ORDER BY timestamp DESC
LIMIT 100;

-- View for signature verification dashboard
CREATE VIEW public.signature_dashboard AS
SELECT 
  ds.signature_type,
  ds.signed_date,
  ds.data_hash,
  ds.signed_at,
  pk.algorithm,
  pk.active as key_active
FROM public.digital_signatures ds
LEFT JOIN public.public_keys pk ON ds.public_key = pk.public_key
ORDER BY ds.signed_at DESC;

-- Grant necessary permissions
GRANT SELECT ON public.recent_merkle_events TO anon, authenticated;
GRANT SELECT ON public.signature_dashboard TO anon, authenticated;
