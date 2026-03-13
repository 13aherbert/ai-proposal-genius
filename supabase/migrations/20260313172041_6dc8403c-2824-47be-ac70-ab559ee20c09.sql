
-- Fix get_plan_limits to return correct project limits for new 4-tier structure
CREATE OR REPLACE FUNCTION public.get_plan_limits(plan_type_param text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  CASE plan_type_param
    WHEN 'starter', 'trial' THEN RETURN 6;
    WHEN 'growth', 'basic' THEN RETURN 36;
    WHEN 'business', 'pro' THEN RETURN 120;
    WHEN 'enterprise' THEN RETURN -1;
    ELSE RETURN 6;
  END CASE;
END;
$function$;

-- Update check_project_limit to exclude archived projects
CREATE OR REPLACE FUNCTION public.check_project_limit(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan_type text;
  v_project_limit integer;
  v_project_count integer;
BEGIN
  SELECT s.plan_type, s.project_limit INTO v_plan_type, v_project_limit
  FROM subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  IF v_plan_type IS NULL THEN
    v_plan_type := 'starter';
    v_project_limit := 6;
  END IF;
  
  IF v_plan_type = 'enterprise' OR v_project_limit = -1 THEN
    RETURN true;
  END IF;
  
  CASE v_plan_type
    WHEN 'starter', 'trial' THEN v_project_limit := 6;
    WHEN 'growth', 'basic' THEN v_project_limit := 36;
    WHEN 'business', 'pro' THEN v_project_limit := 120;
    ELSE v_project_limit := COALESCE(v_project_limit, 6);
  END CASE;
  
  SELECT COUNT(*) INTO v_project_count
  FROM projects p
  WHERE p.user_id = p_user_id
    AND p.status != 'archived';
  
  RETURN v_project_count < v_project_limit;
END;
$function$;
