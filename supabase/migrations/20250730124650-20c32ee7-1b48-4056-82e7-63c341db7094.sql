-- Phase 1: Foundation & Custom Domain Infrastructure

-- Create organization_domains table for custom domain mapping
CREATE TABLE public.organization_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  ssl_certificate_status TEXT DEFAULT 'pending',
  verification_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create organization_branding table for white label theming
CREATE TABLE public.organization_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#64748b',
  accent_color TEXT DEFAULT '#06b6d4',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1e293b',
  font_family TEXT DEFAULT 'Inter',
  custom_css TEXT,
  brand_name TEXT,
  tagline TEXT,
  support_email TEXT,
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create organization_features table for feature flags
CREATE TABLE public.organization_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(organization_id, feature_name)
);

-- Add enterprise configuration fields to organizations
ALTER TABLE public.organizations 
ADD COLUMN subscription_tier TEXT DEFAULT 'starter',
ADD COLUMN max_users INTEGER DEFAULT 5,
ADD COLUMN max_projects INTEGER DEFAULT 3,
ADD COLUMN is_white_label BOOLEAN DEFAULT false,
ADD COLUMN custom_domain_enabled BOOLEAN DEFAULT false,
ADD COLUMN sso_enabled BOOLEAN DEFAULT false,
ADD COLUMN enterprise_features JSONB DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE public.organization_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_features ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_domains
CREATE POLICY "Organization members can view domains" 
ON public.organization_domains 
FOR SELECT 
USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Organization owners can manage domains" 
ON public.organization_domains 
FOR ALL 
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- RLS policies for organization_branding
CREATE POLICY "Organization members can view branding" 
ON public.organization_branding 
FOR SELECT 
USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Organization owners can manage branding" 
ON public.organization_branding 
FOR ALL 
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- RLS policies for organization_features
CREATE POLICY "Organization members can view features" 
ON public.organization_features 
FOR SELECT 
USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Organization owners can manage features" 
ON public.organization_features 
FOR ALL 
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- Create triggers for updated_at columns
CREATE TRIGGER update_organization_domains_updated_at
BEFORE UPDATE ON public.organization_domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_branding_updated_at
BEFORE UPDATE ON public.organization_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_features_updated_at
BEFORE UPDATE ON public.organization_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get organization by domain
CREATE OR REPLACE FUNCTION public.get_organization_by_domain(domain_param TEXT)
RETURNS TABLE(
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  is_white_label BOOLEAN,
  branding JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.slug as organization_slug,
    o.is_white_label,
    row_to_json(ob.*)::jsonb as branding
  FROM public.organization_domains od
  JOIN public.organizations o ON od.organization_id = o.id
  LEFT JOIN public.organization_branding ob ON o.id = ob.organization_id
  WHERE od.domain = domain_param 
    AND od.is_verified = true;
END;
$$;

-- Create function to check if organization has feature enabled
CREATE OR REPLACE FUNCTION public.organization_has_feature(org_id UUID, feature_name_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  feature_enabled BOOLEAN;
BEGIN
  SELECT is_enabled
  INTO feature_enabled
  FROM public.organization_features
  WHERE organization_id = org_id
    AND feature_name = feature_name_param;
  
  RETURN COALESCE(feature_enabled, false);
END;
$$;