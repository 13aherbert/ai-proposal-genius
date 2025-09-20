-- Create API keys table for organization-scoped API access
CREATE TABLE IF NOT EXISTS public.organization_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook configurations table
CREATE TABLE IF NOT EXISTS public.organization_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret_token TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  retry_config JSONB DEFAULT '{"max_retries": 3, "retry_delay": 1000}',
  headers JSONB DEFAULT '{}',
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integration configurations table
CREATE TABLE IF NOT EXISTS public.organization_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'oauth', 'api_key', 'custom'
  integration_name TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  credentials JSONB, -- Encrypted credentials
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'idle', -- 'idle', 'syncing', 'error', 'success'
  error_message TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asset storage table for organization branding assets
CREATE TABLE IF NOT EXISTS public.organization_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- 'logo', 'favicon', 'background', 'custom'
  asset_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.organization_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their organization's API keys" ON public.organization_api_keys
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Organization admins can manage API keys" ON public.organization_api_keys
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Users can view their organization's webhooks" ON public.organization_webhooks
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Organization admins can manage webhooks" ON public.organization_webhooks
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Users can view their organization's integrations" ON public.organization_integrations
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Organization admins can manage integrations" ON public.organization_integrations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Users can view their organization's assets" ON public.organization_assets
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Organization members can manage assets" ON public.organization_assets
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'editor') AND status = 'active'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_organization_api_keys_org_id ON public.organization_api_keys(organization_id);
CREATE INDEX idx_organization_api_keys_active ON public.organization_api_keys(organization_id, is_active);
CREATE INDEX idx_organization_webhooks_org_id ON public.organization_webhooks(organization_id);
CREATE INDEX idx_organization_integrations_org_id ON public.organization_integrations(organization_id);
CREATE INDEX idx_organization_assets_org_id ON public.organization_assets(organization_id);
CREATE INDEX idx_organization_assets_type ON public.organization_assets(organization_id, asset_type);

-- Create triggers for updated_at
CREATE TRIGGER update_organization_api_keys_updated_at
  BEFORE UPDATE ON public.organization_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_webhooks_updated_at
  BEFORE UPDATE ON public.organization_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_integrations_updated_at
  BEFORE UPDATE ON public.organization_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_assets_updated_at
  BEFORE UPDATE ON public.organization_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();