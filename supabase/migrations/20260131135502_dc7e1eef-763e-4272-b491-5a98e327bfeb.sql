-- Add automation tracking columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS automation_status TEXT DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS automation_step TEXT,
ADD COLUMN IF NOT EXISTS automation_progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS automation_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS automation_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS automation_error TEXT;

-- Add index for faster queries on automation status
CREATE INDEX IF NOT EXISTS idx_projects_automation_status 
ON projects(automation_status) WHERE automation_status != 'not_started';

-- Add comment explaining the fields
COMMENT ON COLUMN projects.automation_status IS 'Status of automated proposal generation: not_started, queued, processing, completed, failed';
COMMENT ON COLUMN projects.automation_step IS 'Current step in the automation process';
COMMENT ON COLUMN projects.automation_progress IS 'Progress percentage (0-100) of the automation';
COMMENT ON COLUMN projects.automation_started_at IS 'Timestamp when automation was started';
COMMENT ON COLUMN projects.automation_completed_at IS 'Timestamp when automation completed or failed';
COMMENT ON COLUMN projects.automation_error IS 'Error message if automation failed';