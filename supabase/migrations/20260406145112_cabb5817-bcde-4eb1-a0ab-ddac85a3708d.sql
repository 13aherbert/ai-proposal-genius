-- Comments table for inline proposal commenting
CREATE TABLE public.proposal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.proposal_sections(section_id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.proposal_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  quoted_text TEXT,
  highlight_from INTEGER,
  highlight_to INTEGER,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_comments_project ON public.proposal_comments(project_id);
CREATE INDEX idx_proposal_comments_section ON public.proposal_comments(section_id);
CREATE INDEX idx_proposal_comments_parent ON public.proposal_comments(parent_id);

ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view comments"
ON public.proposal_comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.project_id = proposal_comments.project_id
    AND (p.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = p.project_id AND pc.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Project members can insert comments"
ON public.proposal_comments FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.project_id = proposal_comments.project_id
    AND (p.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = p.project_id AND pc.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can update own comments"
ON public.proposal_comments FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Project members can resolve comments"
ON public.proposal_comments FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.project_id = proposal_comments.project_id
    AND (p.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = p.project_id AND pc.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can delete own comments"
ON public.proposal_comments FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.project_id = proposal_comments.project_id AND p.user_id = auth.uid()
  )
);