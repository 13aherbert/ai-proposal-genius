-- Add audit and migration tracking columns to knowledge_entries
ALTER TABLE public.knowledge_entries 
ADD COLUMN IF NOT EXISTS content_quality_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS migration_status TEXT DEFAULT NULL;

-- Add constraint for migration_status values
ALTER TABLE public.knowledge_entries 
ADD CONSTRAINT knowledge_entries_migration_status_check 
CHECK (migration_status IS NULL OR migration_status IN ('pending', 'migrated', 'reviewed'));

-- Add constraint for content_quality_score range (0-100)
ALTER TABLE public.knowledge_entries 
ADD CONSTRAINT knowledge_entries_content_quality_score_check 
CHECK (content_quality_score IS NULL OR (content_quality_score >= 0 AND content_quality_score <= 100));

-- Create index for efficient querying of migration status
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_migration_status 
ON public.knowledge_entries(migration_status) 
WHERE migration_status IS NOT NULL;