-- Fix foreign key constraint issue with proposal_sections table
-- This will allow user deletion by properly handling the cascade

-- First, let's check and drop the existing foreign key constraint
DO $$ 
BEGIN
    -- Drop existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'proposal_sections_user_id_fkey' 
        AND table_name = 'proposal_sections'
    ) THEN
        ALTER TABLE public.proposal_sections 
        DROP CONSTRAINT proposal_sections_user_id_fkey;
    END IF;
END $$;

-- Now add the foreign key constraint with CASCADE DELETE
-- This will automatically delete proposal sections when a user is deleted
ALTER TABLE public.proposal_sections 
ADD CONSTRAINT proposal_sections_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;