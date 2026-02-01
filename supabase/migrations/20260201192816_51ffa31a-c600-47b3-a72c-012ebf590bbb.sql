-- ================================================================
-- SECURITY FIX: Harden RLS policies for sensitive tables
-- ================================================================

-- 1. FIX: profiles table - Add organization member visibility for collaboration
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy: Users can view their own profile OR profiles of organization members
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile
  profile_id = auth.uid()
  OR
  -- Users can see profiles of people in their organization (for collaboration)
  EXISTS (
    SELECT 1 
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() 
      AND om1.status = 'active'
      AND om2.user_id = profiles.profile_id
      AND om2.status = 'active'
  )
);

-- 2. FIX: organization_api_keys - Ensure no public access, only organization admins
-- Revoke all permissions from anon role
REVOKE ALL ON public.organization_api_keys FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_api_keys TO authenticated;

-- Add comment documenting security requirements
COMMENT ON TABLE public.organization_api_keys IS 
'API keys for organizations. SECURITY: api_key_hash must use strong cryptographic hashing (SHA-256 or bcrypt). Access restricted to organization owners and admins only via RLS.';

-- 3. FIX: password_reset_attempts - Remove public read access, use security definer function
DROP POLICY IF EXISTS "Rate limiting can read attempts" ON public.password_reset_attempts;

-- Create a security definer function for rate limiting checks
CREATE OR REPLACE FUNCTION public.check_password_reset_rate_limit_secure(email_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_attempts INTEGER;
BEGIN
  -- Count attempts in the last hour
  SELECT COUNT(*)
  INTO recent_attempts
  FROM public.password_reset_attempts
  WHERE email = email_param
    AND attempt_time > NOW() - INTERVAL '1 hour';
  
  -- Allow max 3 attempts per hour
  RETURN recent_attempts < 3;
END;
$$;

-- Allow authenticated users to only see their own attempts (by email matching their profile)
CREATE POLICY "Users can view their own reset attempts"
ON public.password_reset_attempts
FOR SELECT
TO authenticated
USING (
  email = (SELECT username FROM public.profiles WHERE profile_id = auth.uid())
);

-- 4. FIX: profiles table - Revoke anon access to prevent any exposure
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- 5. FIX: password_reset_attempts - Revoke anon SELECT access
REVOKE SELECT ON public.password_reset_attempts FROM anon;
GRANT SELECT, INSERT ON public.password_reset_attempts TO authenticated;