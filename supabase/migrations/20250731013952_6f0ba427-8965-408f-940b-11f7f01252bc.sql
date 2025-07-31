-- Fix foreign key constraint issue with security_audit_log table
-- This will allow user deletion by properly handling the cascade

-- First, let's check what foreign key constraints exist and drop them
DO $$ 
BEGIN
    -- Drop existing foreign key constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'security_audit_log_user_id_fkey' 
        AND table_name = 'security_audit_log'
    ) THEN
        ALTER TABLE public.security_audit_log 
        DROP CONSTRAINT security_audit_log_user_id_fkey;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'security_audit_log_target_user_id_fkey' 
        AND table_name = 'security_audit_log'
    ) THEN
        ALTER TABLE public.security_audit_log 
        DROP CONSTRAINT security_audit_log_target_user_id_fkey;
    END IF;
END $$;

-- Now add the foreign key constraints with CASCADE DELETE
-- This will automatically delete security_audit_log entries when a user is deleted
ALTER TABLE public.security_audit_log 
ADD CONSTRAINT security_audit_log_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.security_audit_log 
ADD CONSTRAINT security_audit_log_target_user_id_fkey 
FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;