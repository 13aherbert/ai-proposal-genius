
-- First, let's identify orphaned records that need organization assignment

-- 1. Check for users without current_organization_id in profiles
SELECT 
    p.profile_id,
    p.first_name,
    p.last_name,
    p.business_name,
    p.current_organization_id
FROM profiles p 
WHERE p.current_organization_id IS NULL;

-- 2. Check for projects without organization_id
SELECT 
    pr.project_id,
    pr.title,
    pr.user_id,
    pr.organization_id,
    p.current_organization_id as user_current_org
FROM projects pr
LEFT JOIN profiles p ON pr.user_id = p.profile_id
WHERE pr.organization_id IS NULL;

-- 3. Check for proposal_sections without organization_id
SELECT 
    ps.section_id,
    ps.section_title,
    ps.user_id,
    ps.project_id,
    ps.organization_id,
    p.current_organization_id as user_current_org,
    pr.organization_id as project_org_id
FROM proposal_sections ps
LEFT JOIN profiles p ON ps.user_id = p.profile_id
LEFT JOIN projects pr ON ps.project_id = pr.project_id
WHERE ps.organization_id IS NULL;

-- 4. Check for knowledge_entries without organization_id
SELECT 
    ke.entry_id,
    ke.title,
    ke.user_id,
    ke.organization_id,
    p.current_organization_id as user_current_org
FROM knowledge_entries ke
LEFT JOIN profiles p ON ke.user_id = p.profile_id
WHERE ke.organization_id IS NULL;

-- 5. Migration Strategy: Create default organizations for users who don't have one
-- This will use the existing function to create organizations for users
SELECT 
    p.profile_id,
    public.create_default_organization_for_user(p.profile_id) as new_org_id
FROM profiles p 
WHERE p.current_organization_id IS NULL;

-- 6. Migrate orphaned projects to user's current organization
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

-- 7. Migrate orphaned proposal_sections to match their project's organization
UPDATE proposal_sections 
SET organization_id = (
    SELECT organization_id 
    FROM projects 
    WHERE project_id = proposal_sections.project_id
)
WHERE organization_id IS NULL 
AND project_id IN (
    SELECT project_id 
    FROM projects 
    WHERE organization_id IS NOT NULL
);

-- 8. Migrate orphaned knowledge_entries to user's current organization
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

-- 9. Handle edge cases - create backup records for data that can't be assigned
CREATE TABLE IF NOT EXISTS orphaned_records_backup (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    record_data JSONB NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Backup any records that still can't be migrated
INSERT INTO orphaned_records_backup (table_name, record_id, record_data, reason)
SELECT 
    'projects' as table_name,
    project_id as record_id,
    to_jsonb(projects.*) as record_data,
    'User has no organization assigned' as reason
FROM projects 
WHERE organization_id IS NULL;

INSERT INTO orphaned_records_backup (table_name, record_id, record_data, reason)
SELECT 
    'proposal_sections' as table_name,
    section_id as record_id,
    to_jsonb(proposal_sections.*) as record_data,
    'No valid organization found for project or user' as reason
FROM proposal_sections 
WHERE organization_id IS NULL;

INSERT INTO orphaned_records_backup (table_name, record_id, record_data, reason)
SELECT 
    'knowledge_entries' as table_name,
    entry_id as record_id,
    to_jsonb(knowledge_entries.*) as record_data,
    'User has no organization assigned' as reason
FROM knowledge_entries 
WHERE organization_id IS NULL;

-- 11. Final verification queries to check migration success
SELECT 'Projects without organization_id' as check_type, COUNT(*) as count
FROM projects WHERE organization_id IS NULL
UNION ALL
SELECT 'Proposal sections without organization_id' as check_type, COUNT(*) as count
FROM proposal_sections WHERE organization_id IS NULL
UNION ALL
SELECT 'Knowledge entries without organization_id' as check_type, COUNT(*) as count
FROM knowledge_entries WHERE organization_id IS NULL
UNION ALL
SELECT 'Users without current_organization_id' as check_type, COUNT(*) as count
FROM profiles WHERE current_organization_id IS NULL;
