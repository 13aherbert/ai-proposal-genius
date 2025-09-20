-- Add columns for auto-generated proposal feature
ALTER TABLE public.projects 
ADD COLUMN auto_generated_proposal TEXT,
ADD COLUMN auto_generation_status TEXT DEFAULT 'not_started',
ADD COLUMN auto_generation_metadata JSONB DEFAULT '{}'::jsonb;