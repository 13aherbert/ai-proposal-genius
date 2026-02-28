
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(admin_id uuid, action_type text, max_actions integer DEFAULT 10, window_minutes integer DEFAULT 60)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
BEGIN
  window_start_time := now() - (window_minutes || ' minutes')::interval;
  
  -- Count actions in the current window (qualify column references to avoid ambiguity)
  SELECT COALESCE(SUM(arl.action_count), 0)
  INTO current_count
  FROM public.admin_rate_limits arl
  WHERE arl.admin_user_id = admin_id
    AND arl.action_type = check_admin_rate_limit.action_type
    AND arl.window_start > window_start_time;
  
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
