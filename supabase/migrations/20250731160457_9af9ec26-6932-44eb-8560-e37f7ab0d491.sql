-- Complete fix for infinite recursion by temporarily disabling RLS on organization_members
-- and recreating all policies with a completely different approach

-- First, let's disable RLS on organization_members to break the cycle
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own membership" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view members of organizations they belong to" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can manage all members" ON public.organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON public.organization_members;

-- Create a simple security definer function that doesn't use RLS
CREATE OR REPLACE FUNCTION public.check_organization_membership(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Direct query without RLS to avoid recursion
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = user_id_param
      AND om.organization_id = org_id_param
      AND om.status = 'active'
  );
$$;

-- Create function to check admin status
CREATE OR REPLACE FUNCTION public.check_organization_admin(user_id_param uuid, org_id_param uuid)
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

-- Re-enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create simple policies using the security definer functions
CREATE POLICY "Users can view their own membership"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Members can view organization membership"
ON public.organization_members
FOR SELECT
USING (public.check_organization_membership(auth.uid(), organization_id));

CREATE POLICY "Admins can manage organization membership"
ON public.organization_members
FOR ALL
USING (public.check_organization_admin(auth.uid(), organization_id))
WITH CHECK (public.check_organization_admin(auth.uid(), organization_id));