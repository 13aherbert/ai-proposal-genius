
-- This migration fixes potential issues with admin role checking

-- First, let's ensure the is_admin function is using the most direct approach possible
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Direct SQL query that bypasses all other functions to prevent recursion
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) INTO is_admin_user;
  
  -- Log the check for debugging (can be removed in production)
  INSERT INTO public.admin_role_checks (user_id, result, check_time)
  VALUES (auth.uid(), is_admin_user, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET result = is_admin_user, check_time = now();
  
  RETURN is_admin_user;
END;
$$;

-- Create a diagnostic table to track admin role checks
-- This is temporary and can be removed once issues are resolved
CREATE TABLE IF NOT EXISTS public.admin_role_checks (
  user_id UUID PRIMARY KEY,
  result BOOLEAN NOT NULL,
  check_time TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable row-level security but allow all to select for debugging
ALTER TABLE public.admin_role_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read role checks" ON public.admin_role_checks FOR SELECT USING (true);

-- Create a more reliable check function that bypasses RLS entirely
CREATE OR REPLACE FUNCTION public.direct_admin_check(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Completely direct query with no dependencies
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_id_param
    AND role = 'admin'
  ) INTO is_admin_user;
  
  RETURN is_admin_user;
END;
$$;
