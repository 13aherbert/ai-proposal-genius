
-- Review checklist templates per project
CREATE TABLE public.review_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Section review records (approval history / audit trail)
CREATE TABLE public.section_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.proposal_sections(section_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'revision_requested', 'reassigned')),
  comment TEXT,
  checklist_snapshot JSONB DEFAULT '[]',
  content_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Per-review checklist completion state
CREATE TABLE public.review_checklist_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.proposal_sections(section_id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES public.review_checklist_items(id) ON DELETE CASCADE,
  checked_by UUID REFERENCES auth.users(id),
  checked BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ,
  UNIQUE(section_id, checklist_item_id)
);

-- Real-time presence tracking
CREATE TABLE public.project_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  section_id UUID REFERENCES public.proposal_sections(section_id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT 'viewing',
  last_seen TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.review_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_checklist_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_presence ENABLE ROW LEVEL SECURITY;

-- Enable realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_presence;

-- RLS policies
CREATE POLICY "Project members can view checklist items"
  ON public.review_checklist_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = review_checklist_items.project_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = p.project_id AND pc.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Project owners can manage checklist items"
  ON public.review_checklist_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = review_checklist_items.project_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = review_checklist_items.project_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can view reviews"
  ON public.section_reviews FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = section_reviews.project_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = p.project_id AND pc.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Authenticated users can insert reviews"
  ON public.section_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Members can manage checklist status"
  ON public.review_checklist_status FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_sections ps
      JOIN public.projects p ON p.project_id = ps.project_id
      WHERE ps.section_id = review_checklist_status.section_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = p.project_id AND pc.user_id = auth.uid()
      ))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposal_sections ps
      JOIN public.projects p ON p.project_id = ps.project_id
      WHERE ps.section_id = review_checklist_status.section_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = p.project_id AND pc.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Members can manage presence"
  ON public.project_presence FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = project_presence.project_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = p.project_id AND pc.user_id = auth.uid()
      ))
    )
  )
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_project_presence_last_seen ON public.project_presence(last_seen);
CREATE INDEX idx_section_reviews_section ON public.section_reviews(section_id, created_at DESC);
CREATE INDEX idx_review_checklist_items_project ON public.review_checklist_items(project_id, sort_order);
