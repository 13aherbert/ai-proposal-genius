
-- Create proposal_designs table
CREATE TABLE public.proposal_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'modern-corporate',
  design_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one design per project
CREATE UNIQUE INDEX idx_proposal_designs_project ON public.proposal_designs(project_id);

-- Index for org lookups
CREATE INDEX idx_proposal_designs_org ON public.proposal_designs(organization_id);

-- Enable RLS
ALTER TABLE public.proposal_designs ENABLE ROW LEVEL SECURITY;

-- RLS: org members can view
CREATE POLICY "Organization members can view proposal designs"
  ON public.proposal_designs FOR SELECT
  TO authenticated
  USING (user_belongs_to_organization(auth.uid(), organization_id));

-- RLS: org members can insert
CREATE POLICY "Organization members can insert proposal designs"
  ON public.proposal_designs FOR INSERT
  TO authenticated
  WITH CHECK (user_belongs_to_organization(auth.uid(), organization_id));

-- RLS: org members can update
CREATE POLICY "Organization members can update proposal designs"
  ON public.proposal_designs FOR UPDATE
  TO authenticated
  USING (user_belongs_to_organization(auth.uid(), organization_id));

-- RLS: owners/admins can delete
CREATE POLICY "Organization admins can delete proposal designs"
  ON public.proposal_designs FOR DELETE
  TO authenticated
  USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_proposal_designs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_proposal_designs_updated_at
  BEFORE UPDATE ON public.proposal_designs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_proposal_designs_updated_at();
