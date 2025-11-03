-- Create one_liners table for short quotes
CREATE TABLE public.one_liners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 120),
  district TEXT,
  tags TEXT[] DEFAULT '{}',
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stories table for longer narratives
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 700),
  district TEXT,
  tags TEXT[] DEFAULT '{}',
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create micro_polls table for daily sentiment
CREATE TABLE public.micro_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  poll_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_date)
);

-- Create micro_poll_responses table
CREATE TABLE public.micro_poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.micro_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response INTEGER NOT NULL CHECK (response >= 1 AND response <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Enable Row Level Security
ALTER TABLE public.one_liners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_poll_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for one_liners
CREATE POLICY "Users can CRUD own one-liners"
ON public.one_liners FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read approved one-liners"
ON public.one_liners FOR SELECT
USING (approved = true);

-- RLS Policies for stories
CREATE POLICY "Users can CRUD own stories"
ON public.stories FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read approved stories"
ON public.stories FOR SELECT
USING (approved = true);

-- RLS Policies for micro_polls
CREATE POLICY "Anyone can read active polls"
ON public.micro_polls FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage polls"
ON public.micro_polls FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND is_admin = true
));

-- RLS Policies for micro_poll_responses
CREATE POLICY "Users can view own responses"
ON public.micro_poll_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
ON public.micro_poll_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_one_liners_approved ON public.one_liners(approved, created_at DESC);
CREATE INDEX idx_stories_approved ON public.stories(approved, created_at DESC);
CREATE INDEX idx_one_liners_tags ON public.one_liners USING gin(tags);
CREATE INDEX idx_stories_tags ON public.stories USING gin(tags);
CREATE INDEX idx_micro_polls_date ON public.micro_polls(poll_date DESC);
CREATE INDEX idx_poll_responses_poll ON public.micro_poll_responses(poll_id);

-- Function to get approved one-liners count
CREATE OR REPLACE FUNCTION public.get_approved_one_liners_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.one_liners WHERE approved = true;
$$;

-- Function to get approved stories count
CREATE OR REPLACE FUNCTION public.get_approved_stories_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.stories WHERE approved = true;
$$;

-- Function to get micro poll aggregate (respects n>=20)
CREATE OR REPLACE FUNCTION public.get_poll_aggregate(poll_id_param UUID)
RETURNS TABLE(
  avg_response NUMERIC,
  total_responses INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(response)::NUMERIC, 1) as avg_response,
    COUNT(*)::INTEGER as total_responses
  FROM public.micro_poll_responses
  WHERE poll_id = poll_id_param
  HAVING COUNT(*) >= 20;
END;
$$;