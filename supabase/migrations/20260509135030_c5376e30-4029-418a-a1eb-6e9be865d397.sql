-- 1) Restrict organization_domains visibility (incl. verification_token) to org owners/admins.
DROP POLICY IF EXISTS "Organization members can view domains" ON public.organization_domains;
DROP POLICY IF EXISTS "Users can view organization domains" ON public.organization_domains;
DROP POLICY IF EXISTS "Members can view organization domains" ON public.organization_domains;

CREATE POLICY "Org owners/admins can view domains"
ON public.organization_domains
FOR SELECT
TO authenticated
USING (public.user_is_org_owner_or_admin(auth.uid(), organization_id));

-- 2) password_reset_attempts: remove authenticated SELECT (rate-limit checks already use SECURITY DEFINER functions).
DROP POLICY IF EXISTS "Users can view their own reset attempts" ON public.password_reset_attempts;
DROP POLICY IF EXISTS "Users can view own password reset attempts" ON public.password_reset_attempts;
DROP POLICY IF EXISTS "Users can read their own reset attempts" ON public.password_reset_attempts;
DROP POLICY IF EXISTS "Authenticated users can view password reset attempts" ON public.password_reset_attempts;

REVOKE SELECT ON public.password_reset_attempts FROM authenticated, anon;
-- INSERT remains permitted by existing policy so the auth flow can keep recording attempts.