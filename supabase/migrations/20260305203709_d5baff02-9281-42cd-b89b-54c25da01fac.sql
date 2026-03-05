-- Fix 1: Scope audit/security INSERT policies to user's own organizations

-- security_audit_log - scope to own user_id only (no org_id column)
DROP POLICY IF EXISTS "System can insert security audit log" ON public.security_audit_log;
CREATE POLICY "Users can insert own security audit log"
ON public.security_audit_log FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- security_events_log - scope to own org membership
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events_log;
CREATE POLICY "Members can insert own org security events"
ON public.security_events_log FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.check_organization_membership(auth.uid(), organization_id)
);

-- organization_member_activity - scope to own org membership
DROP POLICY IF EXISTS "System can insert member activity" ON public.organization_member_activity;
DROP POLICY IF EXISTS "Members can insert member activity" ON public.organization_member_activity;
CREATE POLICY "Members can insert own org member activity"
ON public.organization_member_activity FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.check_organization_membership(auth.uid(), organization_id)
);

-- organization_usage_metrics - scope to own org membership
DROP POLICY IF EXISTS "System can insert usage metrics" ON public.organization_usage_metrics;
DROP POLICY IF EXISTS "Members can insert usage metrics" ON public.organization_usage_metrics;
CREATE POLICY "Members can insert own org usage metrics"
ON public.organization_usage_metrics FOR INSERT TO authenticated
WITH CHECK (
  public.check_organization_membership(auth.uid(), organization_id)
);

-- organization_analytics - scope to own org membership
DROP POLICY IF EXISTS "System can insert analytics" ON public.organization_analytics;
DROP POLICY IF EXISTS "Members can insert analytics" ON public.organization_analytics;
CREATE POLICY "Members can insert own org analytics"
ON public.organization_analytics FOR INSERT TO authenticated
WITH CHECK (
  public.check_organization_membership(auth.uid(), organization_id)
);

-- Fix 2: Restrict webhook SELECT to admins only (secret_key protection)
DROP POLICY IF EXISTS "Org members can view webhooks" ON public.organization_webhooks;
CREATE POLICY "Org admins can view webhooks"
ON public.organization_webhooks FOR SELECT TO authenticated
USING (public.check_organization_admin(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org admins can manage webhooks" ON public.organization_webhooks;
CREATE POLICY "Org admins can insert webhooks"
ON public.organization_webhooks FOR INSERT TO authenticated
WITH CHECK (public.check_organization_admin(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org admins can update webhooks" ON public.organization_webhooks;
CREATE POLICY "Org admins can update webhooks"
ON public.organization_webhooks FOR UPDATE TO authenticated
USING (public.check_organization_admin(auth.uid(), organization_id))
WITH CHECK (public.check_organization_admin(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org admins can delete webhooks" ON public.organization_webhooks;
CREATE POLICY "Org admins can delete webhooks"
ON public.organization_webhooks FOR DELETE TO authenticated
USING (public.check_organization_admin(auth.uid(), organization_id));