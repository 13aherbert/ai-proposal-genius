
-- 1. Fix user_roles: Remove redundant/dangerous ALL policy without WITH CHECK
DROP POLICY IF EXISTS "Admins can manage all roles direct" ON public.user_roles;

-- Remove duplicate SELECT policies (keep one admin + one user view)
DROP POLICY IF EXISTS "Admins can view all roles direct" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles direct" ON public.user_roles;

-- Also remove duplicate delete policy since ALL policy covers it
DROP POLICY IF EXISTS "Admins can delete any user roles" ON public.user_roles;

-- 2. Fix security_events_log: Remove broad member access, keep admin-only
DROP POLICY IF EXISTS "Organization members can view security events" ON public.security_events_log;

-- Add policy for members to see only their own events
CREATE POLICY "Members can view own security events"
ON public.security_events_log FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3. Fix password_reset_attempts: Restrict INSERT to own email
DROP POLICY IF EXISTS "Authenticated users can insert password reset attempts" ON public.password_reset_attempts;

CREATE POLICY "Users can insert own password reset attempts"
ON public.password_reset_attempts FOR INSERT TO authenticated
WITH CHECK (
  email = (SELECT p.username FROM public.profiles p WHERE p.profile_id = auth.uid())
);
