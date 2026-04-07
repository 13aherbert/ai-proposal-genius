
-- KB Review Cycles: configurable review frequency per category
CREATE TABLE public.kb_review_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  review_frequency_days INTEGER NOT NULL DEFAULT 90,
  assigned_to UUID DEFAULT NULL,
  last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  last_reviewed_by UUID DEFAULT NULL,
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, category)
);

-- KB Review History log
CREATE TABLE public.kb_review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  reviewed_by UUID NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT DEFAULT NULL
);

-- KB Q&A Pairs: structured question-answer format
CREATE TABLE public.kb_qa_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- KB Health Scores: cached per-category health metrics
CREATE TABLE public.kb_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  total_entries INTEGER DEFAULT 0,
  stale_entries INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  completeness_score NUMERIC(5,2) DEFAULT 0,
  freshness_score NUMERIC(5,2) DEFAULT 0,
  overall_score NUMERIC(5,2) DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, category)
);

-- RLS policies
ALTER TABLE public.kb_review_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_review_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_qa_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_health_scores ENABLE ROW LEVEL SECURITY;

-- Review cycles: org members can view, admins/owners can manage
CREATE POLICY "Org members can view review cycles" ON public.kb_review_cycles
  FOR SELECT TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can manage review cycles" ON public.kb_review_cycles
  FOR ALL TO authenticated
  USING (public.check_organization_admin(auth.uid(), organization_id))
  WITH CHECK (public.check_organization_admin(auth.uid(), organization_id));

-- Review history: org members can view and insert
CREATE POLICY "Org members can view review history" ON public.kb_review_history
  FOR SELECT TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Org members can insert review history" ON public.kb_review_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_organization_member(organization_id, auth.uid()));

-- Q&A pairs: org members can view, members can manage their own
CREATE POLICY "Org members can view qa pairs" ON public.kb_qa_pairs
  FOR SELECT TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Org members can insert qa pairs" ON public.kb_qa_pairs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Users can update own qa pairs" ON public.kb_qa_pairs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own qa pairs" ON public.kb_qa_pairs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.check_organization_admin(auth.uid(), organization_id));

-- Health scores: org members can view, system can manage
CREATE POLICY "Org members can view health scores" ON public.kb_health_scores
  FOR SELECT TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Org members can manage health scores" ON public.kb_health_scores
  FOR ALL TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()))
  WITH CHECK (public.is_organization_member(organization_id, auth.uid()));
