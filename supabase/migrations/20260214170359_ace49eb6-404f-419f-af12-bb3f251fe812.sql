-- Fix SECURITY DEFINER functions missing SET search_path

CREATE OR REPLACE FUNCTION public.admin_delete_user_roles(admin_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin BOOLEAN;
  rows_deleted INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = admin_id AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete user roles';
  END IF;
  
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id
  RETURNING 1 INTO rows_deleted;
  
  RETURN rows_deleted > 0;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error deleting user roles: %', SQLERRM;
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(org_id uuid, target_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_record RECORD;
  total_projects INTEGER := 0;
  total_knowledge INTEGER := 0;
  active_users INTEGER := 0;
  avg_engagement DECIMAL := 0;
BEGIN
  SELECT COUNT(*) INTO total_projects FROM projects WHERE organization_id = org_id AND created_at::DATE = target_date;
  SELECT COUNT(*) INTO total_knowledge FROM knowledge_entries WHERE organization_id = org_id AND created_at::DATE = target_date;
  SELECT COUNT(*), AVG(calculate_user_engagement_score(org_id, om.user_id, target_date))
  INTO active_users, avg_engagement
  FROM organization_members om
  WHERE om.organization_id = org_id AND om.status = 'active'
    AND EXISTS (SELECT 1 FROM activity_feed af WHERE af.organization_id = org_id AND af.user_id = om.user_id AND af.created_at::DATE = target_date);
  
  INSERT INTO organization_analytics (organization_id, metric_type, metric_category, metric_value, metric_date)
  VALUES 
    (org_id, 'projects_created', 'usage', total_projects, target_date),
    (org_id, 'knowledge_entries_created', 'usage', total_knowledge, target_date),
    (org_id, 'active_users', 'engagement', active_users, target_date),
    (org_id, 'avg_engagement_score', 'engagement', COALESCE(avg_engagement, 0), target_date)
  ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_user_engagement_score(org_id uuid, user_id_param uuid, date_param date)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  engagement_score DECIMAL := 0;
  project_activity INTEGER := 0;
  knowledge_activity INTEGER := 0;
  login_frequency INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO project_activity FROM activity_feed
  WHERE organization_id = org_id AND user_id = user_id_param
    AND created_at >= date_param - INTERVAL '7 days' AND created_at < date_param + INTERVAL '1 day'
    AND resource_type = 'project';
  SELECT COUNT(*) INTO knowledge_activity FROM activity_feed
  WHERE organization_id = org_id AND user_id = user_id_param
    AND created_at >= date_param - INTERVAL '7 days' AND created_at < date_param + INTERVAL '1 day'
    AND resource_type = 'knowledge';
  engagement_score := LEAST(100, (project_activity * 10) + (knowledge_activity * 5) + (login_frequency * 3));
  RETURN engagement_score;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_organization_seat_limit(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  used_seats INTEGER;
  max_seats INTEGER;
BEGIN
  SELECT COUNT(*) INTO used_seats FROM public.organization_members WHERE organization_id = org_id AND status = 'active';
  SELECT os.max_seats INTO max_seats FROM public.organization_subscriptions os WHERE os.organization_id = org_id;
  IF max_seats IS NULL THEN max_seats := 5; END IF;
  RETURN used_seats < max_seats;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_organization_for_user(user_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_profile RECORD;
  org_name TEXT;
  org_slug TEXT;
  org_id UUID;
BEGIN
  SELECT first_name, last_name, business_name INTO user_profile FROM public.profiles WHERE profile_id = user_id_param;
  IF user_profile.business_name IS NOT NULL AND user_profile.business_name != '' THEN
    org_name := user_profile.business_name;
  ELSIF user_profile.first_name IS NOT NULL OR user_profile.last_name IS NOT NULL THEN
    org_name := COALESCE(user_profile.first_name, '') || ' ' || COALESCE(user_profile.last_name, '');
    org_name := trim(org_name) || '''s Organization';
  ELSE
    org_name := 'My Organization';
  END IF;
  org_slug := public.generate_organization_slug(org_name);
  INSERT INTO public.organizations (name, slug) VALUES (org_name, org_slug) RETURNING id INTO org_id;
  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (org_id, user_id_param, 'owner');
  UPDATE public.profiles SET current_organization_id = org_id WHERE profile_id = user_id_param;
  UPDATE public.projects SET organization_id = org_id WHERE user_id = user_id_param AND organization_id IS NULL;
  UPDATE public.knowledge_entries SET organization_id = org_id WHERE user_id = user_id_param AND organization_id IS NULL;
  UPDATE public.proposal_sections SET organization_id = org_id WHERE user_id = user_id_param AND organization_id IS NULL;
  RETURN org_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_user_roles_as_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.admin_delete_user_roles(auth.uid(), target_user_id);
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error in delete_user_roles_as_admin: %', SQLERRM;
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_organization_by_domain(domain_param text)
RETURNS TABLE(organization_id uuid, organization_name text, organization_slug text, is_white_label boolean, branding jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT o.id, o.name, o.slug, o.is_white_label, row_to_json(ob.*)::jsonb
  FROM public.organization_domains od
  JOIN public.organizations o ON od.organization_id = o.id
  LEFT JOIN public.organization_branding ob ON o.id = ob.organization_id
  WHERE od.domain = domain_param AND od.is_verified = true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_plan_limits(plan_type_param text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  CASE plan_type_param
    WHEN 'starter' THEN RETURN 3;
    WHEN 'basic' THEN RETURN 10;
    WHEN 'pro' THEN RETURN 30;
    ELSE RETURN 3;
  END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_current_organization(user_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_id UUID;
BEGIN
  SELECT current_organization_id INTO org_id FROM public.profiles WHERE profile_id = user_id_param;
  RETURN org_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_organization_permissions(user_id_param uuid, org_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  member_role organization_role_type;
  custom_permissions JSONB;
  default_permissions JSONB;
BEGIN
  SELECT role, permissions INTO member_role, custom_permissions
  FROM public.organization_members WHERE user_id = user_id_param AND organization_id = org_id_param AND status = 'active';
  IF member_role IS NULL THEN RETURN '{}'::jsonb; END IF;
  CASE member_role
    WHEN 'owner' THEN default_permissions := '{"projects":["create","read","update","delete","share"],"knowledge_base":["create","read","update","delete"],"team_management":["invite","remove","modify_roles","view_activity"],"billing":["view","manage"],"settings":["view","manage"],"analytics":["view","export"],"api_access":["create","manage"],"branding":["manage"]}'::jsonb;
    WHEN 'admin' THEN default_permissions := '{"projects":["create","read","update","delete","share"],"knowledge_base":["create","read","update","delete"],"team_management":["invite","remove","view_activity"],"billing":["view"],"settings":["view","manage"],"analytics":["view","export"],"api_access":["view"]}'::jsonb;
    WHEN 'manager' THEN default_permissions := '{"projects":["create","read","update","share"],"knowledge_base":["create","read","update"],"team_management":["view_activity"],"analytics":["view"]}'::jsonb;
    WHEN 'editor' THEN default_permissions := '{"projects":["create","read","update"],"knowledge_base":["create","read","update"]}'::jsonb;
    WHEN 'viewer' THEN default_permissions := '{"projects":["read"],"knowledge_base":["read"]}'::jsonb;
    WHEN 'billing_admin' THEN default_permissions := '{"projects":["read"],"billing":["view","manage"],"analytics":["view"]}'::jsonb;
    ELSE default_permissions := '{}'::jsonb;
  END CASE;
  RETURN default_permissions || COALESCE(custom_permissions, '{}'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE(organization_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid() AND om.status = 'active';
$function$;

CREATE OR REPLACE FUNCTION public.is_organization_member(org_id uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = org_id AND om.user_id = user_id_param AND om.status = 'active');
$function$;

CREATE OR REPLACE FUNCTION public.log_activity(org_id uuid, user_id_param uuid, action_type_param text, resource_type_param text, resource_id_param uuid DEFAULT NULL::uuid, details_param jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activity_feed (organization_id, user_id, action_type, resource_type, resource_id, details)
  VALUES (org_id, user_id_param, action_type_param, resource_type_param, resource_id_param, details_param) RETURNING id INTO activity_id;
  RETURN activity_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_organization_activity(org_id uuid, user_id_param uuid, activity_type_param text, details_param jsonb DEFAULT '{}'::jsonb, ip_address_param inet DEFAULT NULL::inet, user_agent_param text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  activity_id UUID;
  member_id UUID;
BEGIN
  SELECT id INTO member_id FROM public.organization_members WHERE organization_id = org_id AND user_id = user_id_param;
  INSERT INTO public.organization_member_activity (organization_id, user_id, member_id, activity_type, details, ip_address, user_agent)
  VALUES (org_id, user_id_param, member_id, activity_type_param, details_param, ip_address_param, user_agent_param) RETURNING id INTO activity_id;
  RETURN activity_id;
END;
$function$;

-- Fix the two overloads of log_security_event
CREATE OR REPLACE FUNCTION public.log_security_event(event_type_param text, target_user_id_param uuid DEFAULT NULL::uuid, details_param jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (event_type, user_id, target_user_id, details)
  VALUES (event_type_param, auth.uid(), target_user_id_param, details_param) RETURNING id INTO log_id;
  RETURN log_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(org_id uuid, user_id_param uuid, event_type_param text, event_details_param jsonb DEFAULT '{}'::jsonb, ip_address_param inet DEFAULT NULL::inet, user_agent_param text DEFAULT NULL::text, session_id_param text DEFAULT NULL::text, risk_level_param text DEFAULT 'low'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events_log (organization_id, user_id, event_type, event_details, ip_address, user_agent, session_id, risk_level)
  VALUES (org_id, user_id_param, event_type_param, event_details_param, ip_address_param, user_agent_param, session_id_param, risk_level_param) RETURNING id INTO event_id;
  RETURN event_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.migrate_user_subscriptions_to_organizations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sub_record RECORD;
BEGIN
  FOR sub_record IN 
    SELECT s.*, p.current_organization_id FROM public.subscriptions s
    JOIN public.profiles p ON s.user_id = p.profile_id WHERE p.current_organization_id IS NOT NULL
  LOOP
    INSERT INTO public.organization_subscriptions (organization_id, subscription_id, status, plan_type, stripe_customer_id, stripe_subscription_id, current_period_end, project_limit, features, cancel_at_period_end, created_at, updated_at)
    VALUES (sub_record.current_organization_id, sub_record.subscription_id, sub_record.status, sub_record.plan_type, sub_record.stripe_customer_id, sub_record.stripe_subscription_id, sub_record.current_period_end, sub_record.project_limit, sub_record.features, sub_record.cancel_at_period_end, sub_record.created_at, sub_record.updated_at)
    ON CONFLICT (organization_id) DO NOTHING;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.organization_has_feature(org_id uuid, feature_name_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  feature_enabled BOOLEAN;
BEGIN
  SELECT is_enabled INTO feature_enabled FROM public.organization_features WHERE organization_id = org_id AND feature_name = feature_name_param;
  RETURN COALESCE(feature_enabled, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.request_data_export(org_id uuid, target_user_id uuid, request_type_param text DEFAULT 'export'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  request_id UUID;
BEGIN
  IF NOT user_belongs_to_organization(auth.uid(), org_id) THEN
    RAISE EXCEPTION 'User does not belong to organization';
  END IF;
  IF target_user_id != auth.uid() AND NOT user_is_org_owner_or_admin(auth.uid(), org_id) THEN
    RAISE EXCEPTION 'Insufficient permissions to export data for other users';
  END IF;
  INSERT INTO public.data_export_requests (organization_id, user_id, request_type, requested_by)
  VALUES (org_id, target_user_id, request_type_param, auth.uid()) RETURNING id INTO request_id;
  RETURN request_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.switch_user_organization(user_id_param uuid, org_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_member BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = user_id_param AND organization_id = org_id_param) INTO is_member;
  IF NOT is_member THEN RETURN FALSE; END IF;
  UPDATE public.profiles SET current_organization_id = org_id_param WHERE profile_id = user_id_param;
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_log_project_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.organization_id IS NOT NULL THEN
    PERFORM log_activity(NEW.organization_id, NEW.user_id, 'created', 'project', NEW.project_id, jsonb_build_object('title', NEW.title));
  ELSIF TG_OP = 'UPDATE' AND NEW.organization_id IS NOT NULL THEN
    IF OLD.title != NEW.title OR OLD.status != NEW.status THEN
      PERFORM log_activity(NEW.organization_id, NEW.user_id, 'updated', 'project', NEW.project_id, jsonb_build_object('title', NEW.title, 'status', NEW.status, 'changes', jsonb_build_object('title_changed', OLD.title != NEW.title, 'status_changed', OLD.status != NEW.status)));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_organization_usage_metric(org_id uuid, metric_type_param text, increment_value integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.organization_usage_metrics (organization_id, metric_type, metric_value, metric_date)
  VALUES (org_id, metric_type_param, increment_value, CURRENT_DATE)
  ON CONFLICT (organization_id, metric_type, metric_date) DO UPDATE SET metric_value = organization_usage_metrics.metric_value + increment_value;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_subscription_status_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.user_status_cache
    SET subscription_status = NEW.status, subscription_plan = NEW.plan_type, project_limit = NEW.project_limit, last_updated = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_status_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_status_cache (user_id, is_admin, is_beta_tester, has_user_role, subscription_status, subscription_plan, project_limit, last_updated)
    SELECT NEW.user_id,
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'admin'),
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'beta_tester'),
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'user'),
      s.status, s.plan_type, s.project_limit, now()
    FROM public.subscriptions s WHERE s.user_id = NEW.user_id LIMIT 1
    ON CONFLICT (user_id) DO UPDATE SET
      is_admin = (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'admin')),
      is_beta_tester = (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'beta_tester')),
      has_user_role = (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'user')),
      last_updated = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_status_cache SET
      is_admin = (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = OLD.user_id AND role = 'admin')),
      is_beta_tester = (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = OLD.user_id AND role = 'beta_tester')),
      has_user_role = (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = OLD.user_id AND role = 'user')),
      last_updated = now()
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$function$;