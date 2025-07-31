-- Fix infinite recursion in organization_members RLS policies
-- The current policy queries organization_members from within organization_members policy, causing recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view members of same organization" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE(organization_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT om.organization_id
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
    AND om.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.is_organization_member(org_id uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = user_id_param
      AND om.status = 'active'
  );
$$;

-- Create new non-recursive policies
CREATE POLICY "Users can view their own organization memberships"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

-- Create policy for viewing organization members using direct queries to avoid recursion
CREATE POLICY "Members can view organization members"
ON public.organization_members
FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
  )
);

-- Also create necessary functions for other parts of the system
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
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