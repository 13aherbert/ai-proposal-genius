-- Phase 5: Analytics & Business Intelligence Database Schema

-- Organization analytics data table
CREATE TABLE organization_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'projects_created', 'users_active', 'features_used', etc.
  metric_category TEXT NOT NULL, -- 'usage', 'engagement', 'revenue', 'performance'
  metric_value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  additional_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_org_analytics_org_date ON organization_analytics(organization_id, metric_date);
CREATE INDEX idx_org_analytics_type_date ON organization_analytics(metric_type, metric_date);
CREATE INDEX idx_org_analytics_category ON organization_analytics(metric_category);

-- Custom reports table
CREATE TABLE organization_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'usage', 'financial', 'engagement', 'custom'
  report_config JSONB NOT NULL, -- Contains filters, metrics, etc.
  schedule_config JSONB DEFAULT '{}', -- For automated reports
  is_automated BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_generated_at TIMESTAMP WITH TIME ZONE
);

-- Generated reports storage
CREATE TABLE organization_report_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES organization_reports(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  output_format TEXT NOT NULL, -- 'pdf', 'excel', 'csv', 'json'
  file_url TEXT,
  file_size INTEGER,
  generated_by UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Business intelligence insights
CREATE TABLE organization_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'trend', 'anomaly', 'prediction', 'recommendation'
  insight_category TEXT NOT NULL, -- 'usage', 'growth', 'churn', 'revenue'
  insight_title TEXT NOT NULL,
  insight_description TEXT NOT NULL,
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  is_actionable BOOLEAN DEFAULT FALSE,
  action_suggested TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_dismissed BOOLEAN DEFAULT FALSE
);

-- Analytics aggregation views for better performance
CREATE VIEW organization_metrics_summary AS
SELECT 
  organization_id,
  metric_date,
  COUNT(CASE WHEN metric_type = 'projects_created' THEN 1 END) as projects_created,
  COUNT(CASE WHEN metric_type = 'users_active' THEN 1 END) as active_users,
  AVG(CASE WHEN metric_type = 'user_engagement_score' THEN metric_value END) as avg_engagement,
  SUM(CASE WHEN metric_type = 'revenue_generated' THEN metric_value END) as total_revenue
FROM organization_analytics
GROUP BY organization_id, metric_date;

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(org_id UUID, user_id_param UUID, date_param DATE)
RETURNS DECIMAL AS $$
DECLARE
  engagement_score DECIMAL := 0;
  project_activity INTEGER := 0;
  knowledge_activity INTEGER := 0;
  login_frequency INTEGER := 0;
BEGIN
  -- Count project activities in the last 7 days
  SELECT COUNT(*) INTO project_activity
  FROM activity_feed
  WHERE organization_id = org_id 
    AND user_id = user_id_param
    AND created_at >= date_param - INTERVAL '7 days'
    AND created_at < date_param + INTERVAL '1 day'
    AND resource_type = 'project';
  
  -- Count knowledge base activities
  SELECT COUNT(*) INTO knowledge_activity
  FROM activity_feed
  WHERE organization_id = org_id 
    AND user_id = user_id_param
    AND created_at >= date_param - INTERVAL '7 days'
    AND created_at < date_param + INTERVAL '1 day'
    AND resource_type = 'knowledge';
  
  -- Calculate engagement score (0-100)
  engagement_score := LEAST(100, (project_activity * 10) + (knowledge_activity * 5) + (login_frequency * 3));
  
  RETURN engagement_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(org_id UUID, target_date DATE)
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  total_projects INTEGER := 0;
  total_knowledge INTEGER := 0;
  active_users INTEGER := 0;
  avg_engagement DECIMAL := 0;
BEGIN
  -- Count projects created
  SELECT COUNT(*) INTO total_projects
  FROM projects
  WHERE organization_id = org_id
    AND created_at::DATE = target_date;
  
  -- Count knowledge entries created
  SELECT COUNT(*) INTO total_knowledge
  FROM knowledge_entries
  WHERE organization_id = org_id
    AND created_at::DATE = target_date;
  
  -- Count active users and calculate engagement
  SELECT COUNT(*), AVG(calculate_user_engagement_score(org_id, om.user_id, target_date))
  INTO active_users, avg_engagement
  FROM organization_members om
  WHERE om.organization_id = org_id
    AND om.status = 'active'
    AND EXISTS (
      SELECT 1 FROM activity_feed af
      WHERE af.organization_id = org_id
        AND af.user_id = om.user_id
        AND af.created_at::DATE = target_date
    );
  
  -- Insert analytics data
  INSERT INTO organization_analytics (organization_id, metric_type, metric_category, metric_value, metric_date)
  VALUES 
    (org_id, 'projects_created', 'usage', total_projects, target_date),
    (org_id, 'knowledge_entries_created', 'usage', total_knowledge, target_date),
    (org_id, 'active_users', 'engagement', active_users, target_date),
    (org_id, 'avg_engagement_score', 'engagement', COALESCE(avg_engagement, 0), target_date)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE organization_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_report_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_insights ENABLE ROW LEVEL SECURITY;

-- Analytics policies
CREATE POLICY "Organization members can view analytics"
ON organization_analytics FOR SELECT
USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "System can insert analytics"
ON organization_analytics FOR INSERT
WITH CHECK (true);

-- Reports policies
CREATE POLICY "Organization admins can manage reports"
ON organization_reports FOR ALL
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

CREATE POLICY "Organization members can view reports"
ON organization_reports FOR SELECT
USING (user_belongs_to_organization(auth.uid(), organization_id));

-- Report outputs policies
CREATE POLICY "Organization members can view report outputs"
ON organization_report_outputs FOR SELECT
USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Organization admins can manage report outputs"
ON organization_report_outputs FOR ALL
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- Insights policies
CREATE POLICY "Organization members can view insights"
ON organization_insights FOR SELECT
USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Organization admins can manage insights"
ON organization_insights FOR ALL
USING (user_is_org_owner_or_admin(auth.uid(), organization_id));

-- Triggers for automatic updates
CREATE TRIGGER update_organization_reports_updated_at
BEFORE UPDATE ON organization_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();