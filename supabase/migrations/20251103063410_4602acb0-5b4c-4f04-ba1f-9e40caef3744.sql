-- Create campaigns table for reusable pledge campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  statement TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  open_date DATE NOT NULL DEFAULT CURRENT_DATE,
  close_date DATE,
  min_show_n INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pledge_signatures table
CREATE TABLE public.pledge_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  district TEXT,
  one_liner TEXT CHECK (char_length(one_liner) <= 120),
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns (everyone can read active campaigns)
CREATE POLICY "Anyone can read active campaigns"
ON public.campaigns FOR SELECT
USING (active = true);

-- RLS Policies for pledge_signatures
CREATE POLICY "Users can read own signatures"
ON public.pledge_signatures FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signatures"
ON public.pledge_signatures FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Signatures are immutable (update)"
ON public.pledge_signatures FOR UPDATE
USING (false);

CREATE POLICY "Signatures are immutable (delete)"
ON public.pledge_signatures FOR DELETE
USING (false);

-- Create indexes for performance
CREATE INDEX idx_pledge_signatures_campaign ON public.pledge_signatures(campaign_id);
CREATE INDEX idx_pledge_signatures_user ON public.pledge_signatures(user_id);
CREATE INDEX idx_pledge_signatures_date ON public.pledge_signatures(signed_at DESC);
CREATE INDEX idx_campaigns_key ON public.campaigns(key);

-- Function to get campaign summary (aggregate counts only)
CREATE OR REPLACE FUNCTION public.get_campaign_summary(c_key TEXT)
RETURNS TABLE(
  total INTEGER,
  today INTEGER,
  min_show_n INTEGER,
  statement TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Function to get campaign districts (only when n>=threshold)
CREATE OR REPLACE FUNCTION public.get_campaign_districts(c_key TEXT)
RETURNS TABLE(
  district TEXT,
  count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  threshold INTEGER;
BEGIN
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
$$;

-- Function to check if current user has signed
CREATE OR REPLACE FUNCTION public.has_user_signed(c_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pledge_signatures ps
    JOIN campaigns c ON c.id = ps.campaign_id
    WHERE c.key = c_key AND ps.user_id = auth.uid()
  );
END;
$$;

-- Seed the campaign
INSERT INTO public.campaigns (key, statement, min_show_n)
VALUES ('no_notwithstanding', 'I stand against using the notwithstanding clause to limit educator rights.', 20)
ON CONFLICT (key) DO NOTHING;