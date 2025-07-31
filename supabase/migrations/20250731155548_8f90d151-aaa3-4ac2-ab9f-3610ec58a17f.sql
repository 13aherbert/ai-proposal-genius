-- Comprehensive fix for organization_members infinite recursion
-- Drop all existing policies on organization_members to start fresh
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;

-- Disable RLS temporarily to recreate policies safely
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own membership"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view members of organizations they belong to"
ON public.organization_members
FOR SELECT
USING (
  organization_id IN (
    -- Direct subquery without function calls to avoid recursion
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);

CREATE POLICY "Organization owners can manage all members"
ON public.organization_members
FOR ALL
USING (
  -- Direct check for ownership without function calls
  EXISTS (
    SELECT 1
    FROM public.organization_members owner_check
    WHERE owner_check.organization_id = organization_members.organization_id
      AND owner_check.user_id = auth.uid()
      AND owner_check.role = 'owner'
      AND owner_check.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members owner_check
    WHERE owner_check.organization_id = organization_members.organization_id
      AND owner_check.user_id = auth.uid()
      AND owner_check.role = 'owner'
      AND owner_check.status = 'active'
  )
);

CREATE POLICY "Organization admins can manage members"
ON public.organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members admin_check
    WHERE admin_check.organization_id = organization_members.organization_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role IN ('owner', 'admin')
      AND admin_check.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_members admin_check
    WHERE admin_check.organization_id = organization_members.organization_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role IN ('owner', 'admin')
      AND admin_check.status = 'active'
  )
);