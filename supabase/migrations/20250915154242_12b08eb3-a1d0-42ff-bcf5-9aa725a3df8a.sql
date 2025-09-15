-- Add parsing status fields to knowledge_entries table
ALTER TABLE knowledge_entries 
ADD COLUMN IF NOT EXISTS parsing_status text DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS parsing_progress integer DEFAULT 0 CHECK (parsing_progress >= 0 AND parsing_progress <= 100),
ADD COLUMN IF NOT EXISTS parsing_error text,
ADD COLUMN IF NOT EXISTS file_metadata jsonb DEFAULT '{}';

-- Add index for parsing status queries
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_parsing_status ON knowledge_entries(parsing_status);

-- Update existing entries to have completed status if they have content
UPDATE knowledge_entries 
SET parsing_status = 'completed', parsing_progress = 100 
WHERE (content IS NOT NULL AND content != '') OR (parsed_content IS NOT NULL AND parsed_content != '');