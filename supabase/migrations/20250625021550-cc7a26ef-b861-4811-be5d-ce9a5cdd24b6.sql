
-- Phase 2: Complete Schema Updates
-- Now that data is cleaned up, apply the schema constraints and RLS policies

-- 1. Add foreign key constraints only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_organization_id_fkey' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT projects_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'proposal_sections_organization_id_fkey' 
        AND table_name = 'proposal_sections'
    ) THEN
        ALTER TABLE proposal_sections 
        ADD CONSTRAINT proposal_sections_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'knowledge_entries_organization_id_fkey' 
        AND table_name = 'knowledge_entries'
    ) THEN
        ALTER TABLE knowledge_entries 
        ADD CONSTRAINT knowledge_entries_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'activity_feed_organization_id_fkey' 
        AND table_name = 'activity_feed'
    ) THEN
        ALTER TABLE activity_feed 
        ADD CONSTRAINT activity_feed_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_organization_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Make organization_id NOT NULL (now that all records have been migrated)
ALTER TABLE projects 
ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE proposal_sections 
ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE knowledge_entries 
ALTER COLUMN organization_id SET NOT NULL;

-- 3. Enable RLS on all tables if not already enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can access their own projects" ON projects;
DROP POLICY IF EXISTS "Users can access their own proposal sections" ON proposal_sections;
DROP POLICY IF EXISTS "Users can access their own knowledge entries" ON knowledge_entries;

-- 4. Create organization-based RLS policies for projects
DROP POLICY IF EXISTS "Users can access projects in their organizations" ON projects;
CREATE POLICY "Users can access projects in their organizations" 
ON projects FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- 5. Create organization-based RLS policies for proposal_sections
DROP POLICY IF EXISTS "Users can access proposal sections in their organizations" ON proposal_sections;
CREATE POLICY "Users can access proposal sections in their organizations" 
ON proposal_sections FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- 6. Create organization-based RLS policies for knowledge_entries
DROP POLICY IF EXISTS "Users can access knowledge entries in their organizations" ON knowledge_entries;
CREATE POLICY "Users can access knowledge entries in their organizations" 
ON knowledge_entries FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- 7. Create RLS policies for organizations
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" 
ON organizations FOR SELECT 
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
CREATE POLICY "Organization owners can update their organizations" 
ON organizations FOR UPDATE 
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- 8. Create RLS policies for organization_members
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
CREATE POLICY "Users can view members of their organizations" 
ON organization_members FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Organization owners/admins can manage members" ON organization_members;
CREATE POLICY "Organization owners/admins can manage members" 
ON organization_members FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- 9. Create RLS policies for organization_subscriptions
DROP POLICY IF EXISTS "Users can view subscriptions of their organizations" ON organization_subscriptions;
CREATE POLICY "Users can view subscriptions of their organizations" 
ON organization_subscriptions FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Organization owners can manage subscriptions" ON organization_subscriptions;
CREATE POLICY "Organization owners can manage subscriptions" 
ON organization_subscriptions FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- 10. Create RLS policies for activity_feed
DROP POLICY IF EXISTS "Users can view activity in their organizations" ON activity_feed;
CREATE POLICY "Users can view activity in their organizations" 
ON activity_feed FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- 11. Create RLS policies for notifications
DROP POLICY IF EXISTS "Users can access notifications in their organizations" ON notifications;
CREATE POLICY "Users can access notifications in their organizations" 
ON notifications FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid()
);

-- 12. Update triggers to ensure organization_id is set automatically
CREATE OR REPLACE FUNCTION public.auto_assign_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If organization_id is not provided, use user's current organization
  IF NEW.organization_id IS NULL THEN
    SELECT current_organization_id 
    INTO NEW.organization_id
    FROM profiles 
    WHERE profile_id = NEW.user_id;
    
    -- If user still doesn't have an organization, create one
    IF NEW.organization_id IS NULL THEN
      NEW.organization_id := public.create_default_organization_for_user(NEW.user_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the trigger to relevant tables
DROP TRIGGER IF EXISTS auto_assign_organization_projects ON projects;
CREATE TRIGGER auto_assign_organization_projects
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION auto_assign_organization_id();

DROP TRIGGER IF EXISTS auto_assign_organization_knowledge ON knowledge_entries;
CREATE TRIGGER auto_assign_organization_knowledge
  BEFORE INSERT ON knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION auto_assign_organization_id();

DROP TRIGGER IF EXISTS auto_assign_organization_proposals ON proposal_sections;
CREATE TRIGGER auto_assign_organization_proposals
  BEFORE INSERT ON proposal_sections
  FOR EACH ROW EXECUTE FUNCTION auto_assign_organization_id();

-- Final verification
SELECT 
  'Phase 2 Complete' as status,
  'Multi-tenant architecture with organization-based RLS is now active' as message;
