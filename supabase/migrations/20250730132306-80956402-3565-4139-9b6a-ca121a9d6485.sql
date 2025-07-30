-- Phase 2: Enterprise Subscription & Team Management

-- Enhanced organization member roles with granular permissions
CREATE TYPE organization_role_type AS ENUM ('owner', 'admin', 'manager', 'editor', 'viewer', 'billing_admin');

-- Update organization_members to use the new role type and add permissions
ALTER TABLE public.organization_members 
DROP CONSTRAINT IF EXISTS organization_members_role_check,
ALTER COLUMN role TYPE organization_role_type USING role::organization_role_type,
ADD COLUMN permissions JSONB DEFAULT '{}',
ADD COLUMN department TEXT,
ADD COLUMN title TEXT,
ADD COLUMN status TEXT DEFAULT 'active',
ADD COLUMN invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE;

-- Create organization member activity tracking
CREATE TABLE public.organization_member_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  member_id UUID NOT NULL REFERENCES public.organization_members(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'login', 'project_created', 'document_uploaded', etc.
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enhanced organization subscriptions with seat management
ALTER TABLE public.organization_subscriptions
ADD COLUMN billing_model TEXT DEFAULT 'flat_rate', -- 'per_user', 'flat_rate', 'usage_based'
ADD COLUMN used_seats INTEGER DEFAULT 1,
ADD COLUMN max_seats INTEGER DEFAULT 5,
ADD COLUMN custom_pricing JSONB DEFAULT '{}',
ADD COLUMN billing_cycle TEXT DEFAULT 'monthly', -- 'monthly', 'yearly'
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN billing_contact_email TEXT,
ADD COLUMN billing_address JSONB DEFAULT '{}';

-- Create organization billing history
CREATE TABLE public.organization_billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.organization_subscriptions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL, -- 'pending', 'paid', 'failed', 'refunded'
  stripe_invoice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create organization usage metrics
CREATE TABLE public.organization_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'projects_created', 'storage_used', 'api_calls', etc.
  metric_value INTEGER NOT NULL,
  metric_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(organization_id, metric_type, metric_date)
);

-- Create organization API keys for integrations
CREATE TABLE public.organization_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on new tables
ALTER TABLE public.organization_member_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_member_activity
CREATE POLICY "Organization admins can view member activity" 
ON public.organization_member_activity 
FOR SELECT 
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

CREATE POLICY "System can insert member activity" 
ON public.organization_member_activity 
FOR INSERT 
WITH CHECK (true);

-- RLS policies for organization_billing_history
CREATE POLICY "Organization owners can view billing history" 
ON public.organization_billing_history 
FOR SELECT 
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- RLS policies for organization_usage_metrics
CREATE POLICY "Organization members can view usage metrics" 
ON public.organization_usage_metrics 
FOR SELECT 
USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "System can insert usage metrics" 
ON public.organization_usage_metrics 
FOR INSERT 
WITH CHECK (true);

-- RLS policies for organization_api_keys
CREATE POLICY "Organization admins can manage API keys" 
ON public.organization_api_keys 
FOR ALL 
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- Create triggers for updated_at columns
CREATE TRIGGER update_organization_api_keys_updated_at
BEFORE UPDATE ON public.organization_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check organization seat limits
CREATE OR REPLACE FUNCTION public.check_organization_seat_limit(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  used_seats INTEGER;
  max_seats INTEGER;
BEGIN
  -- Get current seat usage
  SELECT COUNT(*)
  INTO used_seats
  FROM public.organization_members
  WHERE organization_id = org_id AND status = 'active';
  
  -- Get seat limit from subscription
  SELECT os.max_seats
  INTO max_seats
  FROM public.organization_subscriptions os
  WHERE os.organization_id = org_id;
  
  -- If no subscription found, use default limit
  IF max_seats IS NULL THEN
    max_seats := 5;
  END IF;
  
  RETURN used_seats < max_seats;
END;
$$;

-- Create function to update organization usage metrics
CREATE OR REPLACE FUNCTION public.update_organization_usage_metric(
  org_id UUID,
  metric_type_param TEXT,
  increment_value INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.organization_usage_metrics (
    organization_id,
    metric_type,
    metric_value,
    metric_date
  ) 
  VALUES (
    org_id,
    metric_type_param,
    increment_value,
    CURRENT_DATE
  )
  ON CONFLICT (organization_id, metric_type, metric_date)
  DO UPDATE SET 
    metric_value = organization_usage_metrics.metric_value + increment_value;
END;
$$;

-- Create function to get organization permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_organization_permissions(user_id_param UUID, org_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_role organization_role_type;
  custom_permissions JSONB;
  default_permissions JSONB;
BEGIN
  -- Get user's role and custom permissions in the organization
  SELECT role, permissions
  INTO member_role, custom_permissions
  FROM public.organization_members
  WHERE user_id = user_id_param AND organization_id = org_id_param AND status = 'active';
  
  -- If user is not a member, return empty permissions
  IF member_role IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  -- Define default permissions by role
  CASE member_role
    WHEN 'owner' THEN
      default_permissions := '{
        "projects": ["create", "read", "update", "delete", "share"],
        "knowledge_base": ["create", "read", "update", "delete"],
        "team_management": ["invite", "remove", "modify_roles", "view_activity"],
        "billing": ["view", "manage"],
        "settings": ["view", "manage"],
        "analytics": ["view", "export"],
        "api_access": ["create", "manage"],
        "branding": ["manage"]
      }'::jsonb;
    WHEN 'admin' THEN
      default_permissions := '{
        "projects": ["create", "read", "update", "delete", "share"],
        "knowledge_base": ["create", "read", "update", "delete"],
        "team_management": ["invite", "remove", "view_activity"],
        "billing": ["view"],
        "settings": ["view", "manage"],
        "analytics": ["view", "export"],
        "api_access": ["view"]
      }'::jsonb;
    WHEN 'manager' THEN
      default_permissions := '{
        "projects": ["create", "read", "update", "share"],
        "knowledge_base": ["create", "read", "update"],
        "team_management": ["view_activity"],
        "analytics": ["view"]
      }'::jsonb;
    WHEN 'editor' THEN
      default_permissions := '{
        "projects": ["create", "read", "update"],
        "knowledge_base": ["create", "read", "update"]
      }'::jsonb;
    WHEN 'viewer' THEN
      default_permissions := '{
        "projects": ["read"],
        "knowledge_base": ["read"]
      }'::jsonb;
    WHEN 'billing_admin' THEN
      default_permissions := '{
        "projects": ["read"],
        "billing": ["view", "manage"],
        "analytics": ["view"]
      }'::jsonb;
    ELSE
      default_permissions := '{}'::jsonb;
  END CASE;
  
  -- Merge default permissions with custom permissions
  RETURN default_permissions || COALESCE(custom_permissions, '{}'::jsonb);
END;
$$;

-- Create function to log organization member activity
CREATE OR REPLACE FUNCTION public.log_organization_activity(
  org_id UUID,
  user_id_param UUID,
  activity_type_param TEXT,
  details_param JSONB DEFAULT '{}',
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  member_id UUID;
BEGIN
  -- Get member ID
  SELECT id INTO member_id
  FROM public.organization_members
  WHERE organization_id = org_id AND user_id = user_id_param;
  
  -- Insert activity log
  INSERT INTO public.organization_member_activity (
    organization_id,
    user_id,
    member_id,
    activity_type,
    details,
    ip_address,
    user_agent
  ) VALUES (
    org_id,
    user_id_param,
    member_id,
    activity_type_param,
    details_param,
    ip_address_param,
    user_agent_param
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;