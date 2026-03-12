
-- Organization integrations table (core table for all integrations)
CREATE TABLE public.organization_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  integration_name TEXT NOT NULL,
  configuration JSONB DEFAULT '{}'::jsonb,
  credentials JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'idle',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.organization_integrations ENABLE ROW LEVEL SECURITY;

-- Org members can view integrations
CREATE POLICY "org_members_view_integrations" ON public.organization_integrations
  FOR SELECT TO authenticated
  USING (public.check_organization_membership(auth.uid(), organization_id));

-- Org admins can manage integrations
CREATE POLICY "org_admins_manage_integrations" ON public.organization_integrations
  FOR ALL TO authenticated
  USING (public.check_organization_admin(auth.uid(), organization_id))
  WITH CHECK (public.check_organization_admin(auth.uid(), organization_id));

-- Integration field mappings table
CREATE TABLE public.integration_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.organization_integrations(id) ON DELETE CASCADE,
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transform_type TEXT DEFAULT 'direct',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.integration_field_mappings ENABLE ROW LEVEL SECURITY;

-- Members can view field mappings via integration's org
CREATE POLICY "org_members_view_field_mappings" ON public.integration_field_mappings
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_integrations oi
    WHERE oi.id = integration_id
    AND public.check_organization_membership(auth.uid(), oi.organization_id)
  ));

-- Admins can manage field mappings
CREATE POLICY "org_admins_manage_field_mappings" ON public.integration_field_mappings
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_integrations oi
    WHERE oi.id = integration_id
    AND public.check_organization_admin(auth.uid(), oi.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_integrations oi
    WHERE oi.id = integration_id
    AND public.check_organization_admin(auth.uid(), oi.organization_id)
  ));

-- Integration sync logs table
CREATE TABLE public.integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.organization_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'full',
  direction TEXT NOT NULL DEFAULT 'push',
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- Members can view sync logs
CREATE POLICY "org_members_view_sync_logs" ON public.integration_sync_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organization_integrations oi
    WHERE oi.id = integration_id
    AND public.check_organization_membership(auth.uid(), oi.organization_id)
  ));

-- Service role inserts sync logs (edge functions use service role)
CREATE POLICY "service_insert_sync_logs" ON public.integration_sync_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_integrations oi
    WHERE oi.id = integration_id
    AND public.check_organization_membership(auth.uid(), oi.organization_id)
  ));

-- Updated_at trigger for organization_integrations
CREATE TRIGGER update_organization_integrations_updated_at
  BEFORE UPDATE ON public.organization_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for integration_field_mappings
CREATE TRIGGER update_integration_field_mappings_updated_at
  BEFORE UPDATE ON public.integration_field_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
