-- Phase 4: Security & SSO Infrastructure
-- Create security events log table
CREATE TABLE IF NOT EXISTS public.security_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security audit log table (global security events)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data export requests table (already exists, keeping for completeness)

-- Create compliance reports table (already exists)

-- Phase 5: Analytics & BI Infrastructure
-- organization_analytics table already exists

-- Create custom reports table (organization_reports already exists)

-- Create report outputs table (organization_report_outputs already exists)

-- Create organization insights table (organization_insights already exists)

-- Enable RLS on new tables
ALTER TABLE public.security_events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_events_log
CREATE POLICY "Organization members can view security events"
ON public.security_events_log
FOR SELECT
USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "System can insert security events"
ON public.security_events_log
FOR INSERT
WITH CHECK (true);

-- Create RLS policies for security_audit_log
CREATE POLICY "System admins can view security audit log"
ON public.security_audit_log
FOR SELECT
USING (is_system_admin() OR is_admin());

CREATE POLICY "System can insert security audit log"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_org_date ON public.security_events_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events_log(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_date ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user ON public.security_audit_log(user_id, created_at DESC);

-- Helper functions for security and analytics
CREATE OR REPLACE FUNCTION public.log_security_event(
  org_id UUID,
  user_id_param UUID,
  event_type_param TEXT,
  event_details_param JSONB DEFAULT '{}',
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL,
  risk_level_param TEXT DEFAULT 'low'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events_log (
    organization_id,
    user_id,
    event_type,
    event_details,
    ip_address,
    user_agent,
    session_id,
    risk_level
  ) VALUES (
    org_id,
    user_id_param,
    event_type_param,
    event_details_param,
    ip_address_param,
    user_agent_param,
    session_id_param,
    risk_level_param
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Function to request data export
CREATE OR REPLACE FUNCTION public.request_data_export(
  org_id UUID,
  target_user_id UUID,
  request_type_param TEXT DEFAULT 'export'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id UUID;
BEGIN
  -- Verify the requester has permission
  IF NOT user_belongs_to_organization(auth.uid(), org_id) THEN
    RAISE EXCEPTION 'User does not belong to organization';
  END IF;
  
  -- Only allow users to export their own data unless they're an admin
  IF target_user_id != auth.uid() AND NOT user_is_org_owner_or_admin(auth.uid(), org_id) THEN
    RAISE EXCEPTION 'Insufficient permissions to export data for other users';
  END IF;
  
  INSERT INTO public.data_export_requests (
    organization_id,
    user_id,
    request_type,
    requested_by
  ) VALUES (
    org_id,
    target_user_id,
    request_type_param,
    auth.uid()
  ) RETURNING id INTO request_id;
  
  RETURN request_id;
END;
$$;

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION public.calculate_user_engagement_score(
  org_id UUID,
  user_id_param UUID,
  date_param DATE
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  engagement_score DECIMAL := 0;
  project_activity INTEGER := 0;
  knowledge_activity INTEGER := 0;
  login_frequency INTEGER := 0;
BEGIN
  -- Count project activities in the last 7 days
  SELECT COUNT(*) INTO project_activity
  FROM activity_feed
  WHERE organization_id = org_id 
    AND user_id = user_id_param
    AND created_at >= date_param - INTERVAL '7 days'
    AND created_at < date_param + INTERVAL '1 day'
    AND resource_type = 'project';
  
  -- Count knowledge base activities
  SELECT COUNT(*) INTO knowledge_activity
  FROM activity_feed
  WHERE organization_id = org_id 
    AND user_id = user_id_param
    AND created_at >= date_param - INTERVAL '7 days'
    AND created_at < date_param + INTERVAL '1 day'
    AND resource_type = 'knowledge';
  
  -- Calculate engagement score (0-100)
  engagement_score := LEAST(100, (project_activity * 10) + (knowledge_activity * 5) + (login_frequency * 3));
  
  RETURN engagement_score;
END;
$$;

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(
  org_id UUID,
  target_date DATE
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  total_projects INTEGER := 0;
  total_knowledge INTEGER := 0;
  active_users INTEGER := 0;
  avg_engagement DECIMAL := 0;
BEGIN
  -- Count projects created
  SELECT COUNT(*) INTO total_projects
  FROM projects
  WHERE organization_id = org_id
    AND created_at::DATE = target_date;
  
  -- Count knowledge entries created
  SELECT COUNT(*) INTO total_knowledge
  FROM knowledge_entries
  WHERE organization_id = org_id
    AND created_at::DATE = target_date;
  
  -- Count active users and calculate engagement
  SELECT COUNT(*), AVG(calculate_user_engagement_score(org_id, om.user_id, target_date))
  INTO active_users, avg_engagement
  FROM organization_members om
  WHERE om.organization_id = org_id
    AND om.status = 'active'
    AND EXISTS (
      SELECT 1 FROM activity_feed af
      WHERE af.organization_id = org_id
        AND af.user_id = om.user_id
        AND af.created_at::DATE = target_date
    );
  
  -- Insert analytics data
  INSERT INTO organization_analytics (organization_id, metric_type, metric_category, metric_value, metric_date)
  VALUES 
    (org_id, 'projects_created', 'usage', total_projects, target_date),
    (org_id, 'knowledge_entries_created', 'usage', total_knowledge, target_date),
    (org_id, 'active_users', 'engagement', active_users, target_date),
    (org_id, 'avg_engagement_score', 'engagement', COALESCE(avg_engagement, 0), target_date)
  ON CONFLICT DO NOTHING;
END;
$$;