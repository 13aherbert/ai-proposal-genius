
CREATE TABLE public.enterprise_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  email text NOT NULL,
  team_size text,
  message text,
  source text NOT NULL DEFAULT 'pricing' CHECK (source IN ('pricing','contact','csm','white_label','other')),
  requested_tier text NOT NULL DEFAULT 'enterprise' CHECK (requested_tier IN ('enterprise','white_label')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','rejected')),
  converted_org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  notes text,
  submitted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_enterprise_leads_status ON public.enterprise_leads(status);
CREATE INDEX idx_enterprise_leads_created_at ON public.enterprise_leads(created_at DESC);

ALTER TABLE public.enterprise_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a lead (public form)
CREATE POLICY "Anyone can submit enterprise leads"
ON public.enterprise_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "System admins can view leads"
ON public.enterprise_leads FOR SELECT
TO authenticated
USING (public.is_system_admin());

CREATE POLICY "System admins can update leads"
ON public.enterprise_leads FOR UPDATE
TO authenticated
USING (public.is_system_admin())
WITH CHECK (public.is_system_admin());

CREATE POLICY "System admins can delete leads"
ON public.enterprise_leads FOR DELETE
TO authenticated
USING (public.is_system_admin());

CREATE TRIGGER update_enterprise_leads_updated_at
BEFORE UPDATE ON public.enterprise_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
