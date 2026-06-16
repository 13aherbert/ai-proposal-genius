
-- Revoke sensitive columns from client roles
REVOKE SELECT (invitation_token) ON public.organization_member_invitations FROM anon, authenticated;
REVOKE SELECT (invitation_token) ON public.organization_members FROM anon, authenticated;
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.organization_subscriptions FROM anon, authenticated;
REVOKE SELECT (stripe_price_id) ON public.subscription_plan_templates FROM anon, authenticated;
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.subscriptions FROM anon, authenticated;
REVOKE SELECT (stripe_price_id) ON public.lifetime_deal_codes FROM anon, authenticated;
REVOKE SELECT (stripe_customer_id) ON public.lifetime_deal_redemptions FROM anon, authenticated;

-- Restrict brand guidelines writes to org admins/owners only
DROP POLICY IF EXISTS "Organization admins can insert brand guidelines" ON public.organization_brand_guidelines;
DROP POLICY IF EXISTS "Organization admins can update brand guidelines" ON public.organization_brand_guidelines;
DROP POLICY IF EXISTS "Organization admins can delete brand guidelines" ON public.organization_brand_guidelines;

CREATE POLICY "Organization admins can insert brand guidelines"
  ON public.organization_brand_guidelines FOR INSERT
  WITH CHECK (public.user_is_org_owner_or_admin(auth.uid(), organization_id));

CREATE POLICY "Organization admins can update brand guidelines"
  ON public.organization_brand_guidelines FOR UPDATE
  USING (public.user_is_org_owner_or_admin(auth.uid(), organization_id));

CREATE POLICY "Organization admins can delete brand guidelines"
  ON public.organization_brand_guidelines FOR DELETE
  USING (public.user_is_org_owner_or_admin(auth.uid(), organization_id));
