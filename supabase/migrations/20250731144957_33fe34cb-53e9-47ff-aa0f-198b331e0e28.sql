-- Fix infinite recursion in organization_members RLS policies
-- The issue is likely in the policies that reference the same table they're protecting

-- First, let's recreate the user_belongs_to_organization function without recursion
CREATE OR REPLACE FUNCTION user_belongs_to_organization(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = user_id_param
      AND om.organization_id = org_id_param
      AND om.status = 'active'
  );
$$;

-- Create a safe user_is_org_owner_or_admin function
CREATE OR REPLACE FUNCTION user_is_org_owner_or_admin(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.organization_members;

-- Create new safe policies for organization_members
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

CREATE POLICY "Users can view own membership"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Organization owners can manage members"
ON public.organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
      AND om.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
      AND om.status = 'active'
  )
);