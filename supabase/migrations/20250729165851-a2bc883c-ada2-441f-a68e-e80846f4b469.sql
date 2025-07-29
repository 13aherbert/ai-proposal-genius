-- Phase 1: Critical Database Security Fixes

-- 1. Fix RLS on password_reset_attempts table
ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- Add policy to allow only authenticated users to insert attempts
CREATE POLICY "Users can insert password reset attempts" 
ON public.password_reset_attempts 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Add policy for rate limiting function to read attempts
CREATE POLICY "Rate limiting can read attempts" 
ON public.password_reset_attempts 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Add search_path to database functions that are missing it
-- Update functions to include SET search_path TO 'public'

CREATE OR REPLACE FUNCTION public.get_all_user_roles()
 RETURNS TABLE(id uuid, user_id uuid, role text, created_at timestamp with time zone, created_by uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT ur.id, ur.user_id, ur.role, ur.created_at, ur.created_by
  FROM public.user_roles ur;
END;
$function$;

CREATE OR REPLACE FUNCTION public.invite_beta_tester(email_param text, inviter_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invite_id UUID;
  invite_code TEXT;
  expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate invitation code
  invite_code := SUBSTRING(MD5(random()::text || clock_timestamp()::text) FROM 1 FOR 8);
  
  -- Set expiration date (30 days from now)
  expiry_date := NOW() + INTERVAL '30 days';
  
  -- Create invitation
  INSERT INTO beta_invitations(
    email, 
    invite_code, 
    invited_by, 
    status, 
    expires_at
  ) VALUES (
    email_param,
    invite_code,
    inviter_id,
    'pending',
    expiry_date
  )
  RETURNING id INTO invite_id;
  
  RETURN invite_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_pending_invitation(email_param text)
 RETURNS TABLE(id uuid, email text, invite_code text, invited_by uuid, status text, created_at timestamp with time zone, accepted_at timestamp with time zone, expires_at timestamp with time zone, invitation_email_sent boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id, 
    bi.email, 
    bi.invite_code, 
    bi.invited_by,
    bi.status,
    bi.created_at,
    bi.accepted_at,
    bi.expires_at,
    bi.invitation_email_sent
  FROM beta_invitations bi
  WHERE bi.email = email_param
  AND bi.status = 'pending'
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_invitation_code(code_param text)
 RETURNS TABLE(id uuid, email text, invite_code text, invited_by uuid, status text, created_at timestamp with time zone, accepted_at timestamp with time zone, expires_at timestamp with time zone, invitation_email_sent boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id, 
    bi.email, 
    bi.invite_code, 
    bi.invited_by,
    bi.status, 
    bi.created_at, 
    bi.accepted_at, 
    bi.expires_at, 
    bi.invitation_email_sent
  FROM beta_invitations bi
  WHERE bi.invite_code = code_param
    AND bi.status = 'pending';
    
  -- Update the status to 'expired' if the invitation has expired
  UPDATE beta_invitations
  SET status = 'expired'
  WHERE invite_code = code_param
    AND status = 'pending'
    AND expires_at < NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_beta_invitation_status(invitation_id_param uuid, status_param text, accepted_at_param timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated BOOLEAN;
BEGIN
  UPDATE beta_invitations
  SET 
    status = status_param,
    accepted_at = CASE 
      WHEN status_param = 'accepted' THEN COALESCE(accepted_at_param, NOW())
      ELSE accepted_at
    END,
    updated_at = NOW()
  WHERE id = invitation_id_param
  RETURNING true INTO updated;
  
  RETURN COALESCE(updated, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_beta_invitation_direct(invitation_id_param uuid)
 RETURNS TABLE(id uuid, email text, invite_code text, invited_by uuid, status text, created_at timestamp with time zone, accepted_at timestamp with time zone, expires_at timestamp with time zone, invitation_email_sent boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id, 
    bi.email, 
    bi.invite_code, 
    bi.invited_by,
    bi.status, 
    bi.created_at, 
    bi.accepted_at, 
    bi.expires_at, 
    bi.invitation_email_sent
  FROM beta_invitations bi
  WHERE bi.id = invitation_id_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_beta_invitation_email_sent(invitation_id_param uuid, sent_status boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated BOOLEAN;
BEGIN
  UPDATE beta_invitations
  SET invitation_email_sent = sent_status
  WHERE id = invitation_id_param
  RETURNING true INTO updated;
  
  RETURN COALESCE(updated, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_subscription_details(user_id_param uuid)
 RETURNS TABLE(subscription_id uuid, status text, plan_type text, current_period_end timestamp with time zone, project_limit integer, features jsonb, stripe_customer_id text, stripe_subscription_id text, cancel_at_period_end boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.subscription_id,
    s.status,
    s.plan_type,
    s.current_period_end,
    s.project_limit,
    s.features,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.cancel_at_period_end
  FROM public.subscriptions s
  WHERE s.user_id = user_id_param
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id_param uuid)
 RETURNS TABLE(is_admin boolean, is_beta_tester boolean, subscription_plan text, subscription_status text, features jsonb, project_limit integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    status.is_admin,
    status.is_beta_tester,
    status.subscription_plan,
    status.subscription_status,
    COALESCE(sub.features, '{}'::jsonb),
    COALESCE(status.project_limit, 3)
  FROM 
    public.check_user_status(user_id_param) status
  LEFT JOIN 
    public.subscriptions sub ON sub.user_id = user_id_param
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_user_roles_by_id(user_id_param uuid)
 RETURNS TABLE(id uuid, user_id uuid, role text, created_at timestamp with time zone, created_by uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Direct SQL query with no dependencies
  RETURN QUERY
  SELECT ur.id, ur.user_id, ur.role, ur.created_at, ur.created_by
  FROM public.user_roles ur
  WHERE ur.user_id = user_id_param;
END;
$function$;

-- 3. Add stronger password policies
CREATE OR REPLACE FUNCTION public.validate_password_policy(password text)
 RETURNS TABLE(is_valid boolean, errors text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  error_list text[] := '{}';
BEGIN
  -- Minimum 8 characters
  IF length(password) < 8 THEN
    error_list := array_append(error_list, 'Password must be at least 8 characters long');
  END IF;
  
  -- Must contain uppercase letter
  IF password !~ '[A-Z]' THEN
    error_list := array_append(error_list, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Must contain lowercase letter
  IF password !~ '[a-z]' THEN
    error_list := array_append(error_list, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Must contain number
  IF password !~ '[0-9]' THEN
    error_list := array_append(error_list, 'Password must contain at least one number');
  END IF;
  
  -- Must contain special character
  IF password !~ '[^A-Za-z0-9]' THEN
    error_list := array_append(error_list, 'Password must contain at least one special character');
  END IF;
  
  RETURN QUERY SELECT array_length(error_list, 1) = 0 OR array_length(error_list, 1) IS NULL, error_list;
END;
$function$;