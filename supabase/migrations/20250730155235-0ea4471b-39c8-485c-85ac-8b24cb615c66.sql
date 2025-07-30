-- Phase 4: SSO Integration and Security Features

-- SSO configuration per organization
CREATE TABLE public.organization_sso_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL, -- 'saml', 'oauth', 'oidc'
  provider_name TEXT NOT NULL,
  configuration JSONB NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced audit logging for security events
CREATE TABLE public.security_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  event_type TEXT NOT NULL, -- 'login', 'logout', 'sso_login', 'password_change', etc.
  event_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR compliance and data export requests
CREATE TABLE public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL, -- 'export', 'deletion'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  export_url TEXT, -- S3 URL for completed exports
  expires_at TIMESTAMP WITH TIME ZONE,
  requested_by UUID NOT NULL,
  processed_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance reports and audits
CREATE TABLE public.compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- 'gdpr', 'security_audit', 'user_activity'
  report_data JSONB NOT NULL,
  generated_by UUID NOT NULL,
  report_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.organization_sso_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SSO configuration
CREATE POLICY "Organization owners can manage SSO config"
ON public.organization_sso_config
FOR ALL
USING (user_is_org_owner_or_admin(auth.uid(), organization_id))
WITH CHECK (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- RLS Policies for security events
CREATE POLICY "Organization admins can view security events"
ON public.security_events_log
FOR SELECT
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

CREATE POLICY "System can insert security events"
ON public.security_events_log
FOR INSERT
WITH CHECK (true);

-- RLS Policies for data export requests
CREATE POLICY "Organization members can view their own export requests"
ON public.data_export_requests
FOR SELECT
USING (
  user_belongs_to_organization(auth.uid(), organization_id) AND
  (user_id = auth.uid() OR user_is_org_owner_or_admin(auth.uid(), organization_id))
);

CREATE POLICY "Organization members can create export requests"
ON public.data_export_requests
FOR INSERT
WITH CHECK (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Organization admins can update export requests"
ON public.data_export_requests
FOR UPDATE
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- RLS Policies for compliance reports
CREATE POLICY "Organization admins can manage compliance reports"
ON public.compliance_reports
FOR ALL
USING (user_is_org_owner_or_admin(auth.uid(), organization_id))
WITH CHECK (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- Functions for logging security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  org_id UUID,
  user_id_param UUID,
  event_type_param TEXT,
  event_details_param JSONB DEFAULT '{}',
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL,
  risk_level_param TEXT DEFAULT 'low'
)
RETURNS UUID
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

-- Function to initiate GDPR data export
CREATE OR REPLACE FUNCTION public.request_data_export(
  org_id UUID,
  target_user_id UUID,
  request_type_param TEXT DEFAULT 'export'
)
RETURNS UUID
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