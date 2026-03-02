-- Fix mutable search_path on check_project_limit and enforce_project_limit

CREATE OR REPLACE FUNCTION public.check_project_limit(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  project_count integer;
  user_limit integer;
  plan_type text;
  subscription_status text;
BEGIN
  SELECT COUNT(*) INTO project_count
  FROM projects p
  WHERE p.user_id = $1;

  SELECT s.plan_type, s.project_limit, s.status
  INTO plan_type, user_limit, subscription_status
  FROM subscriptions s
  WHERE s.user_id = $1
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF plan_type IS NOT NULL THEN
    plan_type := LOWER(TRIM(plan_type));
  END IF;

  IF plan_type = 'starter' AND (user_limit IS NULL OR user_limit != 10) THEN
    user_limit := 10;
  ELSIF plan_type = 'pro' AND (user_limit IS NULL OR user_limit != 30) THEN
    user_limit := 30;
  ELSIF plan_type = 'trial' AND (user_limit IS NULL OR user_limit != 3) THEN
    user_limit := 3;
  END IF;

  IF user_limit IS NULL THEN
    user_limit := 3;
  END IF;

  RETURN project_count < user_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_project_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  limit_check boolean;
BEGIN
  limit_check := public.check_project_limit(NEW.user_id);
  
  IF NOT limit_check THEN
    RAISE EXCEPTION 'Project limit exceeded for your subscription plan';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix overly permissive RLS policies: restrict "System can insert" policies to authenticated role
-- and scope password_reset_attempts to authenticated users

DROP POLICY IF EXISTS "Users can insert password reset attempts" ON public.password_reset_attempts;
CREATE POLICY "Users can insert password reset attempts"
ON public.password_reset_attempts FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert member activity" ON public.organization_member_activity;
CREATE POLICY "System can insert member activity"
ON public.organization_member_activity FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert usage metrics" ON public.organization_usage_metrics;
CREATE POLICY "System can insert usage metrics"
ON public.organization_usage_metrics FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert security events" ON public.security_events_log;
CREATE POLICY "System can insert security events"
ON public.security_events_log FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert analytics" ON public.organization_analytics;
CREATE POLICY "System can insert analytics"
ON public.organization_analytics FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert security audit log" ON public.security_audit_log;
CREATE POLICY "System can insert security audit log"
ON public.security_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);