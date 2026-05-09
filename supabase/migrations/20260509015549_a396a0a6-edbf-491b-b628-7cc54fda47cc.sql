CREATE INDEX IF NOT EXISTS idx_projects_user_lastupdate ON public.projects (user_id, organization_id, last_update_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_user_updated ON public.knowledge_entries (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_org_updated ON public.knowledge_entries (organization_id, updated_at DESC);