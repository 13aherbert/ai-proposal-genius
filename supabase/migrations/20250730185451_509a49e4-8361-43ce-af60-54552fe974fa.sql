-- Phase 2: Organization-Level Subscriptions & Advanced Team Management (Continued)

-- Only create tables and columns that don't exist yet
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

-- Create RLS policy for invitations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_member_invitations' 
    AND policyname = 'Organization admins can manage invitations'
  ) THEN
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
  END IF;
END $$;

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

-- Create RLS policy for usage logs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_usage_logs' 
    AND policyname = 'Organization members can view usage'
  ) THEN
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
  END IF;
END $$;

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

-- Insert default subscription plans (only if they don't exist)
INSERT INTO public.subscription_plan_templates (
  name, display_name, description, billing_model, base_price, seat_limit, project_limit, features, is_enterprise, is_white_label
) VALUES
  ('starter', 'Starter', 'Free plan for individuals', 'flat_rate', 0, 1, 3, '{"api_calls": 1000, "storage_gb": 1}', FALSE, FALSE),
  ('basic', 'Basic', 'Small teams getting started', 'flat_rate', 4900, 5, 10, '{"api_calls": 10000, "storage_gb": 5, "email_support": true}', FALSE, FALSE),
  ('pro', 'Pro', 'Growing teams with advanced needs', 'flat_rate', 9900, 20, 30, '{"api_calls": 50000, "storage_gb": 20, "priority_support": true, "advanced_analytics": true}', FALSE, FALSE),
  ('enterprise', 'Enterprise', 'Large organizations with custom needs', 'per_user', 0, NULL, NULL, '{"api_calls": -1, "storage_gb": -1, "sso": true, "custom_branding": true, "dedicated_support": true}', TRUE, FALSE),
  ('white_label', 'White Label', 'Complete white label solution', 'custom', 0, NULL, NULL, '{"api_calls": -1, "storage_gb": -1, "custom_domains": true, "white_labeling": true, "api_access": true}', TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;