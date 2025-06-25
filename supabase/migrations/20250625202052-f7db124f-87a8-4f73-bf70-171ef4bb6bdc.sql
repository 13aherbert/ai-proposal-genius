
-- Add system_admin to the existing user roles
-- First, let's check if we need to update any enum types or constraints
-- Since the current implementation uses text for roles, we can simply add the new role

-- Update the role checking functions to include system_admin
CREATE OR REPLACE FUNCTION public.check_system_admin_role(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  has_role BOOLEAN;
BEGIN
  -- Direct SQL query that completely bypasses RLS
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_id_param
    AND role = 'system_admin'
  ) INTO has_role;
  
  RETURN has_role;
END;
$$;

-- Create a function to check if current user is system admin
CREATE OR REPLACE FUNCTION public.is_system_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  is_system_admin_user BOOLEAN;
BEGIN
  -- Direct query to avoid any recursion through other functions
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'system_admin'
  ) INTO is_system_admin_user;
  
  RETURN is_system_admin_user;
END;
$$;

-- Update the get_all_user_roles function to include system_admin checks
CREATE OR REPLACE FUNCTION public.get_all_users_with_organizations()
 RETURNS TABLE(
   user_id uuid, 
   email text, 
   first_name text, 
   last_name text, 
   business_name text, 
   roles text[], 
   organization_id uuid, 
   organization_name text, 
   organization_role text,
   subscription_plan text,
   subscription_status text,
   created_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow system_admin or admin users to access this function
  IF NOT (public.is_system_admin() OR public.is_admin()) THEN
    RAISE EXCEPTION 'Access denied: Only system administrators can view all users';
  END IF;

  RETURN QUERY
  SELECT 
    p.profile_id as user_id,
    p.username as email,
    p.first_name,
    p.last_name,
    p.business_name,
    ARRAY(
      SELECT ur.role 
      FROM public.user_roles ur 
      WHERE ur.user_id = p.profile_id
    ) as roles,
    om.organization_id,
    o.name as organization_name,
    om.role as organization_role,
    s.plan_type as subscription_plan,
    s.status as subscription_status,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.organization_members om ON p.profile_id = om.user_id
  LEFT JOIN public.organizations o ON om.organization_id = o.id
  LEFT JOIN public.subscriptions s ON p.profile_id = s.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Create a function to get detailed user information for system admins
CREATE OR REPLACE FUNCTION public.get_user_details_for_admin(target_user_id uuid)
 RETURNS TABLE(
   user_id uuid,
   email text,
   first_name text,
   last_name text,
   business_name text,
   industry text,
   organization_size text,
   use_case text,
   job_title text,
   roles text[],
   organizations jsonb,
   subscription_info jsonb,
   project_count integer,
   knowledge_entries_count integer,
   created_at timestamp with time zone,
   last_sign_in timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow system_admin or admin users to access this function
  IF NOT (public.is_system_admin() OR public.is_admin()) THEN
    RAISE EXCEPTION 'Access denied: Only system administrators can view user details';
  END IF;

  RETURN QUERY
  SELECT 
    p.profile_id as user_id,
    p.username as email,
    p.first_name,
    p.last_name,
    p.business_name,
    p.industry::text,
    p.organization_size::text,
    p.use_case::text,
    p.job_title,
    ARRAY(
      SELECT ur.role 
      FROM public.user_roles ur 
      WHERE ur.user_id = target_user_id
    ) as roles,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'name', o.name,
          'role', om.role,
          'joined_at', om.joined_at
        )
      ) FILTER (WHERE o.id IS NOT NULL),
      '[]'::jsonb
    ) as organizations,
    COALESCE(
      jsonb_build_object(
        'plan_type', s.plan_type,
        'status', s.status,
        'project_limit', s.project_limit,
        'current_period_end', s.current_period_end,
        'created_at', s.created_at
      ),
      '{}'::jsonb
    ) as subscription_info,
    (SELECT COUNT(*)::integer FROM public.projects WHERE user_id = target_user_id) as project_count,
    (SELECT COUNT(*)::integer FROM public.knowledge_entries WHERE user_id = target_user_id) as knowledge_entries_count,
    p.created_at,
    NULL::timestamp with time zone as last_sign_in -- We don't have access to auth.users for last_sign_in
  FROM public.profiles p
  LEFT JOIN public.organization_members om ON p.profile_id = om.user_id
  LEFT JOIN public.organizations o ON om.organization_id = o.id
  LEFT JOIN public.subscriptions s ON p.profile_id = s.user_id
  WHERE p.profile_id = target_user_id
  GROUP BY p.profile_id, p.username, p.first_name, p.last_name, p.business_name, 
           p.industry, p.organization_size, p.use_case, p.job_title, p.created_at,
           s.plan_type, s.status, s.project_limit, s.current_period_end, s.created_at;
END;
$$;
