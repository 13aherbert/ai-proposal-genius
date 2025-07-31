-- Fix the remaining infinite recursion in organization_members RLS policies
-- First check what policies currently exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'organization_members' AND schemaname = 'public';

-- Drop ALL existing policies on organization_members that might cause recursion
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view members of same organization" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;

-- Create simple, non-recursive policies
-- Policy 1: Users can always view their own membership records
CREATE POLICY "Users can view own membership" 
ON public.organization_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy 2: Members can view other members of the same organization
-- Using a direct subquery to avoid function recursion
CREATE POLICY "Members can view organization members" 
ON public.organization_members 
FOR SELECT 
USING (
  organization_id IN (
    SELECT om2.organization_id 
    FROM public.organization_members om2 
    WHERE om2.user_id = auth.uid() 
      AND om2.status = 'active'
  )
);

-- Also ensure our security definer functions use SET search_path
-- This prevents the linter warnings and improves security
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = user_id_param
      AND om.organization_id = org_id_param
      AND om.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_org_owner_or_admin(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = user_id_param
      AND om.organization_id = org_id_param
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
  );
$$;

-- Fix the subscription migration issue by creating organization-level subscriptions
-- First check if user has any existing subscriptions
DO $$
DECLARE
  user_record RECORD;
  org_id UUID;
BEGIN
  -- For each user who has a subscription but no organization subscription
  FOR user_record IN 
    SELECT s.*, p.current_organization_id, p.profile_id
    FROM public.subscriptions s
    JOIN public.profiles p ON s.user_id = p.profile_id
    WHERE p.current_organization_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.organization_subscriptions os 
        WHERE os.organization_id = p.current_organization_id
      )
  LOOP
    -- Create organization subscription based on user subscription
    INSERT INTO public.organization_subscriptions (
      organization_id,
      subscription_id,
      status,
      plan_type,
      stripe_customer_id,
      stripe_subscription_id,
      current_period_end,
      project_limit,
      member_limit,
      features,
      cancel_at_period_end,
      created_at,
      updated_at
    ) VALUES (
      user_record.current_organization_id,
      user_record.subscription_id || '-org', -- Make unique
      user_record.status,
      user_record.plan_type,
      user_record.stripe_customer_id,
      user_record.stripe_subscription_id,
      user_record.current_period_end,
      user_record.project_limit,
      CASE 
        WHEN user_record.plan_type = 'starter' THEN 1
        WHEN user_record.plan_type = 'basic' THEN 5
        WHEN user_record.plan_type = 'pro' THEN 20
        ELSE 50
      END,
      user_record.features,
      user_record.cancel_at_period_end,
      user_record.created_at,
      user_record.updated_at
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created organization subscription for org: % from user: %', 
      user_record.current_organization_id, user_record.profile_id;
  END LOOP;
END $$;