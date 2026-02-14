
-- Create saved_opportunities table
CREATE TABLE public.saved_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  saved_by UUID NOT NULL,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'sam_gov',
  title TEXT NOT NULL,
  solicitation_number TEXT,
  department TEXT,
  naics_code TEXT,
  posted_date TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  set_aside TEXT,
  description_url TEXT,
  raw_data JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'saved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, external_id, source)
);

-- Enable RLS
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Organization members can view saved opportunities"
  ON public.saved_opportunities FOR SELECT
  USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Organization members can insert saved opportunities"
  ON public.saved_opportunities FOR INSERT
  WITH CHECK (user_belongs_to_organization(auth.uid(), organization_id) AND saved_by = auth.uid());

CREATE POLICY "Organization members can update saved opportunities"
  ON public.saved_opportunities FOR UPDATE
  USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Organization members can delete saved opportunities"
  ON public.saved_opportunities FOR DELETE
  USING (user_belongs_to_organization(auth.uid(), organization_id));

-- Index for common queries
CREATE INDEX idx_saved_opportunities_org ON public.saved_opportunities(organization_id);
CREATE INDEX idx_saved_opportunities_status ON public.saved_opportunities(organization_id, status);
