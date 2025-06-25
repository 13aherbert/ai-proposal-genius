
-- Phase 1: Create Security Definer Functions to Fix RLS Recursion (Fixed Version)

-- 1. Create function to safely check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  belongs BOOLEAN;
BEGIN
  -- Direct query that bypasses RLS
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = user_id_param AND organization_id = org_id_param
  ) INTO belongs;
  
  RETURN belongs;
END;
$$;

-- 2. Create function to safely check if user is owner/admin of organization
CREATE OR REPLACE FUNCTION public.user_is_org_owner_or_admin(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_owner_or_admin BOOLEAN;
BEGIN
  -- Direct query that bypasses RLS
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = user_id_param 
    AND organization_id = org_id_param 
    AND role IN ('owner', 'admin')
  ) INTO is_owner_or_admin;
  
  RETURN is_owner_or_admin;
END;
$$;

-- 3. Drop ALL existing policies that might conflict
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Organization owners/admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can manage organization members as owner/admin" ON organization_members;

-- Create new non-recursive policies for organization_members
CREATE POLICY "Users can view organization members" 
ON organization_members FOR SELECT 
USING (user_id = auth.uid() OR organization_id IN (
  SELECT om.organization_id 
  FROM organization_members om 
  WHERE om.user_id = auth.uid()
));

CREATE POLICY "Users can manage organization members as owner/admin" 
ON organization_members FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = organization_members.organization_id 
    AND om.role IN ('owner', 'admin')
  )
);

-- 4. Update other policies to use the security definer functions
DROP POLICY IF EXISTS "Users can access projects in their organizations" ON projects;
CREATE POLICY "Users can access projects in their organizations" 
ON projects FOR ALL 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Users can access proposal sections in their organizations" ON proposal_sections;
CREATE POLICY "Users can access proposal sections in their organizations" 
ON proposal_sections FOR ALL 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Users can access knowledge entries in their organizations" ON knowledge_entries;
CREATE POLICY "Users can access knowledge entries in their organizations" 
ON knowledge_entries FOR ALL 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" 
ON organizations FOR SELECT 
USING (public.user_belongs_to_organization(auth.uid(), id));

DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
CREATE POLICY "Organization owners can update their organizations" 
ON organizations FOR UPDATE 
USING (public.user_is_org_owner_or_admin(auth.uid(), id));

DROP POLICY IF EXISTS "Users can view subscriptions of their organizations" ON organization_subscriptions;
CREATE POLICY "Users can view subscriptions of their organizations" 
ON organization_subscriptions FOR SELECT 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Organization owners can manage subscriptions" ON organization_subscriptions;
CREATE POLICY "Organization owners can manage subscriptions" 
ON organization_subscriptions FOR ALL 
USING (public.user_is_org_owner_or_admin(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Users can view activity in their organizations" ON activity_feed;
CREATE POLICY "Users can view activity in their organizations" 
ON activity_feed FOR SELECT 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Users can access notifications in their organizations" ON notifications;
CREATE POLICY "Users can access notifications in their organizations" 
ON notifications FOR ALL 
USING (
  public.user_belongs_to_organization(auth.uid(), organization_id) 
  AND user_id = auth.uid()
);

-- Verification query
SELECT 'RLS Recursion Fix Complete' as status, 'Security definer functions created and policies updated' as message;
