-- Phase 1: Critical Database Security Fixes

-- Fix search paths in all database functions for security
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_id UUID;
BEGIN
  -- Create profile first with new fields
  INSERT INTO public.profiles (
    profile_id, 
    first_name, 
    last_name, 
    business_name, 
    birthday, 
    username,
    organization_size,
    industry,
    job_title,
    use_case,
    onboarding_segment
  )
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'first_name')::TEXT, ''),
    COALESCE((NEW.raw_user_meta_data->>'last_name')::TEXT, ''),
    COALESCE((NEW.raw_user_meta_data->>'company_name')::TEXT, ''),
    (NEW.raw_user_meta_data->>'birthday')::DATE,
    NEW.email,
    (NEW.raw_user_meta_data->>'organization_size')::organization_size_type,
    (NEW.raw_user_meta_data->>'industry')::industry_type,
    COALESCE((NEW.raw_user_meta_data->>'job_title')::TEXT, ''),
    (NEW.raw_user_meta_data->>'use_case')::use_case_type,
    COALESCE((NEW.raw_user_meta_data->>'onboarding_segment')::TEXT, '')
  );
  
  -- Create default organization for new user
  org_id := public.create_default_organization_for_user(NEW.id);
  
  -- Also automatically assign the 'user' role
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (NEW.id, 'user', NEW.id);
  
  RETURN NEW;
END;
$function$;

-- Add role escalation prevention
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Prevent users from escalating their own roles unless they're already system admin
  IF NEW.user_id = auth.uid() AND NOT public.is_system_admin() THEN
    -- Allow users to assign themselves 'user' role only
    IF NEW.role != 'user' THEN
      RAISE EXCEPTION 'Users cannot escalate their own privileges';
    END IF;
  END IF;
  
  -- Prevent non-system-admins from creating system_admin roles
  IF NEW.role = 'system_admin' AND NOT public.is_system_admin() THEN
    RAISE EXCEPTION 'Only system administrators can assign system_admin role';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for role escalation prevention
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.user_roles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  target_user_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only system admins can view audit logs
CREATE POLICY "System admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (public.is_system_admin());

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type_param TEXT,
  target_user_id_param UUID DEFAULT NULL,
  details_param JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    target_user_id,
    details
  ) VALUES (
    event_type_param,
    auth.uid(),
    target_user_id_param,
    details_param
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;

-- Add password reset attempt tracking
CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET,
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE
);

-- Function to check password reset rate limiting
CREATE OR REPLACE FUNCTION public.check_password_reset_rate_limit(email_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_attempts INTEGER;
BEGIN
  -- Count attempts in the last hour
  SELECT COUNT(*)
  INTO recent_attempts
  FROM public.password_reset_attempts
  WHERE email = email_param
    AND attempt_time > NOW() - INTERVAL '1 hour';
  
  -- Allow max 3 attempts per hour
  RETURN recent_attempts < 3;
END;
$function$;

-- Clean up overlapping RLS policies on user_roles table
DROP POLICY IF EXISTS "Admin users can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin users can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin users can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

-- Create consolidated, secure RLS policies for user_roles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles
FOR ALL
USING (public.is_admin_direct() OR public.is_system_admin())
WITH CHECK (public.is_admin_direct() OR public.is_system_admin());

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());