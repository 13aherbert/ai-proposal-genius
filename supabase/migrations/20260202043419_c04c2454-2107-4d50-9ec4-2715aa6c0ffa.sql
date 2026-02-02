-- ================================================================
-- SECURITY FIX: Restrict admin_role_checks access to system admins only
-- ================================================================

-- Drop the overly permissive policy that exposes admin role check results
DROP POLICY IF EXISTS "Anyone can read role checks" ON public.admin_role_checks;

-- Create a new restrictive policy: Only system admins can view role checks
CREATE POLICY "System admins can read role checks"
ON public.admin_role_checks
FOR SELECT
TO authenticated
USING (public.is_system_admin());

-- Revoke anon access to prevent any unauthenticated access
REVOKE ALL ON public.admin_role_checks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_role_checks TO authenticated;

-- Add documentation about security requirements
COMMENT ON TABLE public.admin_role_checks IS 
'Debugging table for admin role checks. SECURITY: Access restricted to system administrators only via RLS. Contains sensitive information about admin privilege assignments.';