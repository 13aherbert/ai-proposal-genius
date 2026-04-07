
-- 1. Remove overly permissive "Allow authenticated uploads" policy on rfp-files bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 2. Add restrictive INSERT policy on user_roles to prevent privilege escalation
-- Only admins/system_admins (via existing SECURITY DEFINER functions) or the handle_new_user trigger can insert roles
CREATE POLICY "Only admins can insert user roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_direct() OR public.is_system_admin()
);

-- 3. Restrict integration credentials: replace broad SELECT with admin-only SELECT
-- Drop the existing broad membership-based SELECT policy
DROP POLICY IF EXISTS "org_members_view_integrations" ON public.organization_integrations;

-- Create a new SELECT policy restricted to org admins only
CREATE POLICY "org_admins_view_integrations"
ON public.organization_integrations FOR SELECT TO authenticated
USING (
  public.check_organization_admin(auth.uid(), organization_id)
);

-- 4. Harden proposal_sections DELETE to owner or org admin only
DROP POLICY IF EXISTS "Users can delete organization proposal sections" ON public.proposal_sections;

CREATE POLICY "Users can delete organization proposal sections"
ON public.proposal_sections FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.check_organization_admin(auth.uid(), organization_id)
);

-- 5. Harden proposal_sections UPDATE to owner or org admin only
DROP POLICY IF EXISTS "Users can update organization proposal sections" ON public.proposal_sections;

CREATE POLICY "Users can update organization proposal sections"
ON public.proposal_sections FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.check_organization_admin(auth.uid(), organization_id)
);
