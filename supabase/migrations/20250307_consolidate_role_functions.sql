
-- This migration consolidates our role-checking functions to avoid any confusion
-- and ensure consistent behavior across all functions.

-- Update the is_admin function to ensure it's using the latest pattern
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use the has_role function to check for admin role
  -- This avoids duplicating logic across functions
  RETURN public.has_role(auth.uid(), 'admin');
END;
$$;
