
-- Lock down stripe_price_id on subscription_plan_templates
DROP POLICY IF EXISTS "Public can view subscription plan templates" ON public.subscription_plan_templates;
CREATE POLICY "Authenticated users can view subscription plan templates"
  ON public.subscription_plan_templates
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT (stripe_price_id) ON public.subscription_plan_templates FROM anon, authenticated;

-- Hide invitation tokens from non-admin org members
REVOKE SELECT (invitation_token, invitation_expires_at) ON public.organization_members FROM anon, authenticated;
GRANT SELECT (invitation_token, invitation_expires_at) ON public.organization_members TO service_role;
