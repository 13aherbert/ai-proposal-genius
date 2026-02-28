
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip checks when called from service role context (auth.uid() is null)
  -- Service role operations are already authorized by the edge function
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Prevent users from escalating their own roles unless they're already system admin
  IF NEW.user_id = auth.uid() AND NOT public.is_system_admin() THEN
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
