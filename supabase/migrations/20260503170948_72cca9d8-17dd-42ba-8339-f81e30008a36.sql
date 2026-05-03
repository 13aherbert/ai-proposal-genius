
-- 1. Consolidate user_roles policies to remove overlapping permissive rules
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;

CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_direct() OR public.is_system_admin());

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin_direct() OR public.is_system_admin())
WITH CHECK (public.is_admin_direct() OR public.is_system_admin());

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin_direct() OR public.is_system_admin());

-- 2. Restrict credentials column on organization_integrations
-- Encrypted credentials should only be read/written by edge functions (service_role).
REVOKE SELECT (credentials) ON public.organization_integrations FROM anon, authenticated;
REVOKE INSERT (credentials), UPDATE (credentials) ON public.organization_integrations FROM anon, authenticated;
