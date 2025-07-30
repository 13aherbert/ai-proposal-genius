-- Update subscription plan limits and add perpetual trial support
-- First, update any existing 'trial' plans to 'starter' for consistency
UPDATE public.subscriptions 
SET plan_type = 'starter' 
WHERE plan_type = 'trial';

-- Update any existing 'starter' plans to 'basic' (the new paid tier)
UPDATE public.subscriptions 
SET plan_type = 'basic' 
WHERE plan_type = 'starter' AND stripe_customer_id IS NOT NULL;

-- Ensure all users have a default starter subscription
INSERT INTO public.subscriptions (
  user_id,
  subscription_id,
  status,
  plan_type,
  project_limit,
  features,
  current_period_end,
  stripe_customer_id,
  stripe_subscription_id,
  created_at,
  updated_at
)
SELECT 
  p.profile_id,
  gen_random_uuid(),
  'active',
  'starter',
  3,
  '{}',
  NULL, -- No end date for free starter plan
  NULL, -- No Stripe customer for free plan
  NULL, -- No Stripe subscription for free plan
  NOW(),
  NOW()
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.profile_id
WHERE s.user_id IS NULL;

-- Update the subscription limits function if it exists
CREATE OR REPLACE FUNCTION public.get_plan_limits(plan_type_param text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CASE plan_type_param
    WHEN 'starter' THEN RETURN 3;   -- Free tier: 3 projects
    WHEN 'basic' THEN RETURN 10;    -- Basic tier: 10 projects  
    WHEN 'pro' THEN RETURN 30;      -- Pro tier: 30 projects
    ELSE RETURN 3; -- Default to starter limits
  END CASE;
END;
$$;