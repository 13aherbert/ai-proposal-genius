
-- Performance indexes for common query patterns

-- Projects by user (projects list page)
CREATE INDEX IF NOT EXISTS idx_projects_user_id_status ON public.projects (user_id, status);

-- Projects by organization
CREATE INDEX IF NOT EXISTS idx_projects_org_id_status ON public.projects (organization_id, status);

-- Proposal sections by project
CREATE INDEX IF NOT EXISTS idx_proposal_sections_project_id ON public.proposal_sections (project_id);

-- Comments by project (comment sidebar)
CREATE INDEX IF NOT EXISTS idx_proposal_comments_project_id ON public.proposal_comments (project_id, created_at DESC);

-- Comments by section
CREATE INDEX IF NOT EXISTS idx_proposal_comments_section_id ON public.proposal_comments (section_id);

-- Knowledge entries by organization
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_org_id ON public.knowledge_entries (organization_id, category);

-- Analytics events aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_events_org_date ON public.analytics_events (organization_id, created_at);

-- Activity feed by organization (recent activity)
CREATE INDEX IF NOT EXISTS idx_activity_feed_org_created ON public.activity_feed (organization_id, created_at DESC);

-- Project presence (real-time collaboration)
CREATE INDEX IF NOT EXISTS idx_project_presence_project_id ON public.project_presence (project_id, last_seen);

-- Organization members lookup
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members (user_id, status);

-- Notifications for user
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read, created_at DESC);
