-- Fix admin role storage vulnerability by implementing proper user_roles table

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Add RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (false);  -- Will be managed through direct database access only

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (false);

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (false);

-- 5. Create SECURITY DEFINER function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Migrate existing admins from profiles.is_admin to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Update the RLS policy on micro_polls to use the new has_role function
DROP POLICY IF EXISTS "Admins can manage polls" ON public.micro_polls;

CREATE POLICY "Admins can manage polls"
ON public.micro_polls
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Remove the is_admin column from profiles (no longer needed)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;