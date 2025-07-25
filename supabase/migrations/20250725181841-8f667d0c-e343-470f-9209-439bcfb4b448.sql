-- Critical Security Fixes Migration

-- 1. Enable RLS on unprotected tables
ALTER TABLE public._migration_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orphaned_records_backup ENABLE ROW LEVEL SECURITY;

-- 2. Create restrictive RLS policies for _migration_history
CREATE POLICY "System admins only can view migration history" 
ON public._migration_history 
FOR SELECT 
USING (public.is_system_admin());

CREATE POLICY "System admins only can insert migration history" 
ON public._migration_history 
FOR INSERT 
WITH CHECK (public.is_system_admin());

-- 3. Create restrictive RLS policies for orphaned_records_backup
CREATE POLICY "System admins only can view orphaned records" 
ON public.orphaned_records_backup 
FOR SELECT 
USING (public.is_system_admin());

CREATE POLICY "System admins only can insert orphaned records" 
ON public.orphaned_records_backup 
FOR INSERT 
WITH CHECK (public.is_system_admin());

-- 4. Update all database functions to use proper search_path (security definer functions)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_project_last_update_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update last_update_at if the changes are substantive (not just metadata)
  IF (
    NEW.title != OLD.title OR 
    NEW.client_name != OLD.client_name OR 
    NEW.business_name != OLD.business_name OR 
    NEW.status != OLD.status OR 
    NEW.deadline != OLD.deadline OR
    NEW.analysis != OLD.analysis OR
    NEW.proposal_outline != OLD.proposal_outline OR
    NEW.evaluation != OLD.evaluation
  ) THEN
    NEW.last_update_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_assign_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If organization_id is not provided, use user's current organization
  IF NEW.organization_id IS NULL THEN
    SELECT current_organization_id 
    INTO NEW.organization_id
    FROM public.profiles 
    WHERE profile_id = NEW.user_id;
    
    -- If user still doesn't have an organization, create one
    IF NEW.organization_id IS NULL THEN
      NEW.organization_id := public.create_default_organization_for_user(NEW.user_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_organization_slug(org_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from organization name
  base_slug := lower(regexp_replace(trim(org_name), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'org';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;

-- 5. Create audit log function for admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  admin_user_id uuid,
  action_type text,
  target_user_id uuid DEFAULT NULL,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id uuid;
BEGIN
  -- Verify admin status
  IF NOT public.is_admin_direct() AND NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can log actions';
  END IF;

  INSERT INTO public.activity_feed (
    user_id,
    action_type,
    resource_type,
    resource_id,
    details,
    organization_id
  ) VALUES (
    admin_user_id,
    action_type,
    'admin_action',
    target_user_id,
    details,
    (SELECT current_organization_id FROM public.profiles WHERE profile_id = admin_user_id)
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;

-- 6. Update admin delete functions with audit logging
CREATE OR REPLACE FUNCTION public.admin_delete_user_cascade(admin_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin BOOLEAN;
  deletion_success BOOLEAN;
BEGIN
  -- Check if the requesting user is an admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = admin_id AND role IN ('admin', 'system_admin')
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only administrators can delete user accounts';
  END IF;
  
  -- Log the admin action
  PERFORM public.log_admin_action(
    admin_id,
    'delete_user',
    target_user_id,
    jsonb_build_object('timestamp', now())
  );
  
  -- First delete the user's data safely
  deletion_success := public.cascade_delete_user_data(target_user_id);
  
  RETURN deletion_success;
END;
$function$;

-- 7. Strengthen role assignment with validation
CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _role text, _created_by uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_role_id UUID;
  requester_is_admin BOOLEAN;
BEGIN
  -- Verify the requester has permission to assign roles
  SELECT public.is_admin_direct() OR public.is_system_admin() INTO requester_is_admin;
  
  IF NOT requester_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can assign roles';
  END IF;
  
  -- Validate role type
  IF _role NOT IN ('admin', 'beta_tester', 'user', 'system_admin') THEN
    RAISE EXCEPTION 'Invalid role type: %', _role;
  END IF;
  
  -- Prevent non-system-admins from assigning system_admin role
  IF _role = 'system_admin' AND NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Only system administrators can assign system_admin role';
  END IF;
  
  -- First check if the role already exists
  IF public.check_existing_role(_user_id, _role) THEN
    -- Return null if role already exists
    RETURN NULL;
  END IF;
  
  -- Log the role assignment
  PERFORM public.log_admin_action(
    _created_by,
    'assign_role',
    _user_id,
    jsonb_build_object('role', _role, 'timestamp', now())
  );
  
  -- Insert the new role and return the ID
  INSERT INTO public.user_roles(user_id, role, created_by)
  VALUES (_user_id, _role, _created_by)
  RETURNING id INTO new_role_id;
  
  RETURN new_role_id;
END;
$function$;

-- 8. Create rate limiting table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  action_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own rate limits" 
ON public.admin_rate_limits 
FOR SELECT 
USING (admin_user_id = auth.uid() AND (public.is_admin_direct() OR public.is_system_admin()));

-- 9. Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(
  admin_id uuid,
  action_type text,
  max_actions integer DEFAULT 10,
  window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_count integer;
  window_start timestamp with time zone;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  -- Count actions in the current window
  SELECT COALESCE(SUM(action_count), 0)
  INTO current_count
  FROM public.admin_rate_limits
  WHERE admin_user_id = admin_id
    AND action_type = check_admin_rate_limit.action_type
    AND window_start > check_admin_rate_limit.window_start;
  
  -- Check if under limit
  IF current_count >= max_actions THEN
    RETURN FALSE;
  END IF;
  
  -- Record this action
  INSERT INTO public.admin_rate_limits (admin_user_id, action_type, window_start)
  VALUES (admin_id, check_admin_rate_limit.action_type, now())
  ON CONFLICT DO NOTHING;
  
  RETURN TRUE;
END;
$function$;