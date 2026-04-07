-- Analytics events table for tracking all key events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(project_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_events_org ON public.analytics_events(organization_id, created_at DESC);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_project ON public.analytics_events(project_id) WHERE project_id IS NOT NULL;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view analytics events"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (check_organization_membership(auth.uid(), organization_id));

CREATE POLICY "Org members can insert analytics events"
  ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (check_organization_membership(auth.uid(), organization_id) AND user_id = auth.uid());

-- Proposal outcomes for win/loss tracking
CREATE TABLE public.proposal_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost', 'pending', 'cancelled')),
  recorded_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id)
);

ALTER TABLE public.proposal_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view outcomes"
  ON public.proposal_outcomes FOR SELECT TO authenticated
  USING (check_organization_membership(auth.uid(), organization_id));

CREATE POLICY "Org members can insert outcomes"
  ON public.proposal_outcomes FOR INSERT TO authenticated
  WITH CHECK (check_organization_membership(auth.uid(), organization_id));

CREATE POLICY "Org members can update outcomes"
  ON public.proposal_outcomes FOR UPDATE TO authenticated
  USING (check_organization_membership(auth.uid(), organization_id));

-- ROI settings per organization
CREATE TABLE public.analytics_roi_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  hourly_rate NUMERIC DEFAULT 75,
  manual_hours_per_proposal NUMERIC DEFAULT 40,
  subscription_monthly_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analytics_roi_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view ROI settings"
  ON public.analytics_roi_settings FOR SELECT TO authenticated
  USING (check_organization_membership(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage ROI settings"
  ON public.analytics_roi_settings FOR ALL TO authenticated
  USING (check_organization_admin(auth.uid(), organization_id))
  WITH CHECK (check_organization_admin(auth.uid(), organization_id));

CREATE POLICY "Org members can upsert ROI settings"
  ON public.analytics_roi_settings FOR INSERT TO authenticated
  WITH CHECK (check_organization_membership(auth.uid(), organization_id));