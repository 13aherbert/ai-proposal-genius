-- Fix mismatched organization subscription tiers
-- Sync organizations.subscription_tier from the user's subscription plan_type

UPDATE public.organizations o
SET 
  subscription_tier = s.plan_type,
  max_projects = CASE WHEN s.plan_type = 'enterprise' THEN -1
                      WHEN s.plan_type IN ('business', 'pro') THEN 120
                      WHEN s.plan_type IN ('growth', 'basic') THEN 36
                      ELSE 6 END,
  max_users = CASE WHEN s.plan_type IN ('enterprise', 'business', 'pro', 'growth', 'basic') THEN -1
                   ELSE 1 END,
  sso_enabled = CASE WHEN s.plan_type = 'enterprise' THEN true ELSE COALESCE(o.sso_enabled, false) END,
  updated_at = now()
FROM public.organization_members om
JOIN public.subscriptions s ON s.user_id = om.user_id
WHERE om.organization_id = o.id
  AND om.role = 'owner'
  AND s.status = 'active'
  AND (
    o.subscription_tier IS NULL 
    OR o.subscription_tier != s.plan_type
  );