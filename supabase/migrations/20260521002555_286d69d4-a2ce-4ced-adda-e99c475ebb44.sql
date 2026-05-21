-- 1. Revoke sensitive Stripe identifier columns from authenticated/anon
REVOKE SELECT (stripe_customer_id, stripe_subscription_id)
  ON public.organization_subscriptions FROM authenticated, anon;

REVOKE SELECT (stripe_price_id)
  ON public.subscription_plan_templates FROM authenticated, anon;

-- 2. Revoke invitation_token columns from authenticated/anon
REVOKE SELECT (invitation_token)
  ON public.organization_member_invitations FROM authenticated, anon;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'organization_members'
       AND column_name = 'invitation_token'
  ) THEN
    EXECUTE 'REVOKE SELECT (invitation_token) ON public.organization_members FROM authenticated, anon';
  END IF;
END$$;

-- 3. Lock down security_audit_log inserts to service role only
DROP POLICY IF EXISTS "Users can insert own security audit log" ON public.security_audit_log;
DROP POLICY IF EXISTS "Users can insert security audit log" ON public.security_audit_log;
DROP POLICY IF EXISTS "Authenticated users can insert security audit log" ON public.security_audit_log;

-- 4. Tighten user_feedback_submissions INSERT to require membership when org is set
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.user_feedback_submissions;
CREATE POLICY "Users can create their own submissions"
  ON public.user_feedback_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR public.is_organization_member(organization_id, auth.uid())
    )
  );
