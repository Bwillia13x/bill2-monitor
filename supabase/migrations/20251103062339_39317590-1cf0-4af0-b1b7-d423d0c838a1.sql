-- Create signals table for daily educator input
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dissatisfaction_level INTEGER NOT NULL CHECK (dissatisfaction_level >= 0 AND dissatisfaction_level <= 100),
  signal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, signal_date)
);

-- Enable Row Level Security
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Users can only see their own signals
CREATE POLICY "Users can view their own signals" 
ON public.signals 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own signals
CREATE POLICY "Users can insert their own signals" 
ON public.signals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND signal_date = CURRENT_DATE);

-- Users cannot update or delete signals (immutable for data integrity)
CREATE POLICY "Signals are immutable" 
ON public.signals 
FOR UPDATE 
USING (false);

CREATE POLICY "Signals cannot be deleted" 
ON public.signals 
FOR DELETE 
USING (false);

-- Create index for efficient date queries
CREATE INDEX idx_signals_date ON public.signals(signal_date DESC);
CREATE INDEX idx_signals_user_date ON public.signals(user_id, signal_date DESC);

-- Create a function to get aggregate dissatisfaction (respects n>=20 threshold)
CREATE OR REPLACE FUNCTION public.get_aggregate_dissatisfaction()
RETURNS TABLE(
  avg_dissatisfaction NUMERIC,
  total_signals INTEGER,
  signal_date DATE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(dissatisfaction_level)::NUMERIC, 1) as avg_dissatisfaction,
    COUNT(*)::INTEGER as total_signals,
    s.signal_date
  FROM public.signals s
  WHERE s.signal_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY s.signal_date
  HAVING COUNT(*) >= 20
  ORDER BY s.signal_date DESC;
END;
$$;

-- Create a function to get today's aggregate (if n>=20)
CREATE OR REPLACE FUNCTION public.get_today_aggregate()
RETURNS TABLE(
  avg_dissatisfaction NUMERIC,
  total_signals INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(dissatisfaction_level)::NUMERIC, 1) as avg_dissatisfaction,
    COUNT(*)::INTEGER as total_signals
  FROM public.signals
  WHERE signal_date = CURRENT_DATE
  HAVING COUNT(*) >= 20;
END;
$$;