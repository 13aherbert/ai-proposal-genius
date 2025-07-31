-- Fix foreign key constraint issue with projects table
-- This will allow user deletion by properly handling the cascade

-- First, let's check and drop the existing foreign key constraint
DO $$ 
BEGIN
    -- Drop existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_user_id_fkey' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE public.projects 
        DROP CONSTRAINT projects_user_id_fkey;
    END IF;
END $$;

-- Now add the foreign key constraint with CASCADE DELETE
-- This will automatically delete projects when a user is deleted
ALTER TABLE public.projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;