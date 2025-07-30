-- Phase 1: Core Security Functions for Multi-Tenant Architecture

-- Function to check if a user belongs to an organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE user_id = user_id_param 
      AND organization_id = org_id_param 
      AND status = 'active'
  );
END;
$$;

-- Function to check if a user is an owner or admin of an organization
CREATE OR REPLACE FUNCTION public.user_is_org_owner_or_admin(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE user_id = user_id_param 
      AND organization_id = org_id_param 
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
END;
$$;

-- Function to get user's current organization
CREATE OR REPLACE FUNCTION public.get_user_current_org()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT current_organization_id 
  INTO org_id
  FROM public.profiles 
  WHERE profile_id = auth.uid();
  
  RETURN org_id;
END;
$$;

-- Function to check if user can manage organization features
CREATE OR REPLACE FUNCTION public.can_manage_organization(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is owner/admin or has specific feature management permissions
  RETURN user_is_org_owner_or_admin(user_id_param, org_id_param);
END;
$$;

-- Function to check organization subscription limits
CREATE OR REPLACE FUNCTION public.check_organization_limits(org_id_param uuid, limit_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_usage integer;
  limit_value integer;
BEGIN
  CASE limit_type
    WHEN 'projects' THEN
      SELECT COUNT(*) INTO current_usage
      FROM public.projects
      WHERE organization_id = org_id_param;
      
      SELECT project_limit INTO limit_value
      FROM public.organization_subscriptions
      WHERE organization_id = org_id_param;
      
    WHEN 'members' THEN
      SELECT COUNT(*) INTO current_usage
      FROM public.organization_members
      WHERE organization_id = org_id_param AND status = 'active';
      
      SELECT member_limit INTO limit_value
      FROM public.organization_subscriptions
      WHERE organization_id = org_id_param;
      
    ELSE
      RETURN false;
  END CASE;
  
  RETURN COALESCE(current_usage, 0) < COALESCE(limit_value, 3);
END;
$$;

-- Function to enforce organization data isolation
CREATE OR REPLACE FUNCTION public.enforce_organization_isolation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Ensure user can only access data from their organization
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NOT user_belongs_to_organization(auth.uid(), NEW.organization_id) THEN
      RAISE EXCEPTION 'Access denied: User does not belong to organization';
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF NOT user_belongs_to_organization(auth.uid(), OLD.organization_id) THEN
      RAISE EXCEPTION 'Access denied: User does not belong to organization';
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;