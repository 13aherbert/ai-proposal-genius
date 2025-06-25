
-- Phase 2: Database Schema Updates (Data Cleanup First)
-- 1. First, clean up any remaining NULL organization_id values

-- Check for remaining NULL values and assign them to user's current organization
UPDATE projects 
SET organization_id = (
    SELECT current_organization_id 
    FROM profiles 
    WHERE profile_id = projects.user_id
)
WHERE organization_id IS NULL 
AND user_id IN (
    SELECT profile_id 
    FROM profiles 
    WHERE current_organization_id IS NOT NULL
);

-- For any remaining projects where users don't have organizations, create default organizations
DO $$
DECLARE
    project_record RECORD;
    new_org_id UUID;
BEGIN
    FOR project_record IN 
        SELECT DISTINCT user_id 
        FROM projects 
        WHERE organization_id IS NULL
    LOOP
        -- Create default organization for this user
        new_org_id := public.create_default_organization_for_user(project_record.user_id);
        
        -- Update all projects for this user
        UPDATE projects 
        SET organization_id = new_org_id
        WHERE user_id = project_record.user_id AND organization_id IS NULL;
    END LOOP;
END $$;

-- Clean up proposal_sections
UPDATE proposal_sections 
SET organization_id = (
    SELECT current_organization_id 
    FROM profiles 
    WHERE profile_id = proposal_sections.user_id
)
WHERE organization_id IS NULL 
AND user_id IN (
    SELECT profile_id 
    FROM profiles 
    WHERE current_organization_id IS NOT NULL
);

-- Clean up knowledge_entries
UPDATE knowledge_entries 
SET organization_id = (
    SELECT current_organization_id 
    FROM profiles 
    WHERE profile_id = knowledge_entries.user_id
)
WHERE organization_id IS NULL 
AND user_id IN (
    SELECT profile_id 
    FROM profiles 
    WHERE current_organization_id IS NOT NULL
);

-- Final verification before making columns NOT NULL
SELECT 
    'Data cleanup verification' as step,
    (SELECT COUNT(*) FROM projects WHERE organization_id IS NULL) as null_projects,
    (SELECT COUNT(*) FROM proposal_sections WHERE organization_id IS NULL) as null_proposals,
    (SELECT COUNT(*) FROM knowledge_entries WHERE organization_id IS NULL) as null_knowledge;
