-- Phase 2: Organization-Level Subscriptions & Advanced Team Management

-- Create organization subscriptions table
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID UNIQUE DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'trial',
  plan_type TEXT NOT NULL DEFAULT 'starter',
  billing_model TEXT DEFAULT 'flat_rate', -- 'per_user', 'flat_rate', 'usage_based'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  seat_limit INTEGER DEFAULT 5,
  used_seats INTEGER DEFAULT 1,
  project_limit INTEGER DEFAULT 3,
  features JSONB DEFAULT '{}',
  custom_pricing JSONB DEFAULT '{}',
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization subscriptions
CREATE POLICY "Organization members can view subscription"
ON public.organization_subscriptions
FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);

CREATE POLICY "Organization owners/admins can manage subscription"
ON public.organization_subscriptions
FOR ALL
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('owner', 'admin', 'billing_admin')
    AND om.status = 'active'
  )
);

-- Update organization_members with enhanced permissions
ALTER TABLE public.organization_members 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;

-- Create organization member invitations table
CREATE TABLE IF NOT EXISTS public.organization_member_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role organization_role_type NOT NULL DEFAULT 'viewer',
  permissions JSONB DEFAULT '{}',
  department TEXT,
  invited_by UUID REFERENCES auth.users(id),
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'cancelled'
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for invitations
ALTER TABLE public.organization_member_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Organization admins can manage invitations"
ON public.organization_member_invitations
FOR ALL
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('owner', 'admin')
    AND om.status = 'active'
  )
);

-- Create subscription usage tracking table
CREATE TABLE IF NOT EXISTS public.subscription_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.organization_subscriptions(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL, -- 'api_calls', 'storage_gb', 'active_projects', 'team_members'
  usage_amount INTEGER NOT NULL DEFAULT 0,
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscription_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for usage logs
CREATE POLICY "Organization members can view usage"
ON public.subscription_usage_logs
FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);

-- Create subscription plan templates table
CREATE TABLE IF NOT EXISTS public.subscription_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  billing_model TEXT NOT NULL DEFAULT 'flat_rate',
  base_price INTEGER DEFAULT 0, -- in cents
  price_per_seat INTEGER DEFAULT 0, -- in cents per user
  seat_limit INTEGER,
  project_limit INTEGER,
  features JSONB DEFAULT '{}',
  is_enterprise BOOLEAN DEFAULT FALSE,
  is_white_label BOOLEAN DEFAULT FALSE,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plan_templates (
  name, display_name, description, billing_model, base_price, seat_limit, project_limit, features, is_enterprise, is_white_label
) VALUES
  ('starter', 'Starter', 'Free plan for individuals', 'flat_rate', 0, 1, 3, '{"api_calls": 1000, "storage_gb": 1}', FALSE, FALSE),
  ('basic', 'Basic', 'Small teams getting started', 'flat_rate', 4900, 5, 10, '{"api_calls": 10000, "storage_gb": 5, "email_support": true}', FALSE, FALSE),
  ('pro', 'Pro', 'Growing teams with advanced needs', 'flat_rate', 9900, 20, 30, '{"api_calls": 50000, "storage_gb": 20, "priority_support": true, "advanced_analytics": true}', FALSE, FALSE),
  ('enterprise', 'Enterprise', 'Large organizations with custom needs', 'per_user', 0, NULL, NULL, '{"api_calls": -1, "storage_gb": -1, "sso": true, "custom_branding": true, "dedicated_support": true}', TRUE, FALSE),
  ('white_label', 'White Label', 'Complete white label solution', 'custom', 0, NULL, NULL, '{"api_calls": -1, "storage_gb": -1, "custom_domains": true, "white_labeling": true, "api_access": true}', TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Function to create default organization subscription
CREATE OR REPLACE FUNCTION public.create_default_org_subscription(org_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_id UUID;
  trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set trial end to 14 days from now
  trial_end := NOW() + INTERVAL '14 days';
  
  -- Create default subscription
  INSERT INTO public.organization_subscriptions (
    organization_id,
    status,
    plan_type,
    billing_model,
    seat_limit,
    used_seats,
    project_limit,
    trial_ends_at,
    features
  ) VALUES (
    org_id,
    'trial',
    'starter',
    'flat_rate',
    5,
    1,
    3,
    trial_end,
    '{"trial": true}'::jsonb
  ) RETURNING id INTO subscription_id;
  
  RETURN subscription_id;
END;
$$;

-- Function to update organization seat usage
CREATE OR REPLACE FUNCTION public.update_organization_seat_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment used seats
    UPDATE public.organization_subscriptions
    SET used_seats = used_seats + 1
    WHERE organization_id = NEW.organization_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement used seats
    UPDATE public.organization_subscriptions
    SET used_seats = GREATEST(used_seats - 1, 0)
    WHERE organization_id = OLD.organization_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'active' AND OLD.status != 'active' THEN
        -- User became active
        UPDATE public.organization_subscriptions
        SET used_seats = used_seats + 1
        WHERE organization_id = NEW.organization_id;
      ELSIF NEW.status != 'active' AND OLD.status = 'active' THEN
        -- User became inactive
        UPDATE public.organization_subscriptions
        SET used_seats = GREATEST(used_seats - 1, 0)
        WHERE organization_id = NEW.organization_id;
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for seat usage tracking
DROP TRIGGER IF EXISTS organization_seat_usage_trigger ON public.organization_members;
CREATE TRIGGER organization_seat_usage_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_seat_usage();

-- Function to check if organization can add more members
CREATE OR REPLACE FUNCTION public.can_add_organization_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_seats INTEGER;
  seat_limit INTEGER;
BEGIN
  SELECT used_seats, os.seat_limit
  INTO current_seats, seat_limit
  FROM public.organization_subscriptions os
  WHERE organization_id = org_id;
  
  -- If no limit (enterprise/unlimited plans)
  IF seat_limit IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN current_seats < seat_limit;
END;
$$;

-- Update the create_default_organization_for_user function to create subscription
CREATE OR REPLACE FUNCTION public.create_default_organization_for_user(user_id_param uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_profile RECORD;
  org_name TEXT;
  org_slug TEXT;
  org_id UUID;
  subscription_id UUID;
BEGIN
  -- Get user profile information
  SELECT first_name, last_name, business_name 
  INTO user_profile
  FROM public.profiles 
  WHERE profile_id = user_id_param;
  
  -- Determine organization name
  IF user_profile.business_name IS NOT NULL AND user_profile.business_name != '' THEN
    org_name := user_profile.business_name;
  ELSIF user_profile.first_name IS NOT NULL OR user_profile.last_name IS NOT NULL THEN
    org_name := COALESCE(user_profile.first_name, '') || ' ' || COALESCE(user_profile.last_name, '');
    org_name := trim(org_name) || '''s Organization';
  ELSE
    org_name := 'My Organization';
  END IF;
  
  -- Generate unique slug
  org_slug := public.generate_organization_slug(org_name);
  
  -- Create organization
  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO org_id;
  
  -- Add user as owner of the organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_id, user_id_param, 'owner');
  
  -- Create default subscription for the organization
  subscription_id := public.create_default_org_subscription(org_id);
  
  -- Update user's current organization
  UPDATE public.profiles
  SET current_organization_id = org_id
  WHERE profile_id = user_id_param;
  
  -- Migrate user's existing data to the organization
  UPDATE public.projects
  SET organization_id = org_id
  WHERE user_id = user_id_param AND organization_id IS NULL;
  
  UPDATE public.knowledge_entries
  SET organization_id = org_id
  WHERE user_id = user_id_param AND organization_id IS NULL;
  
  UPDATE public.proposal_sections
  SET organization_id = org_id
  WHERE user_id = user_id_param AND organization_id IS NULL;
  
  RETURN org_id;
END;
$function$;

-- Create updated_at trigger for organization_subscriptions
CREATE TRIGGER update_organization_subscriptions_updated_at
  BEFORE UPDATE ON public.organization_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();