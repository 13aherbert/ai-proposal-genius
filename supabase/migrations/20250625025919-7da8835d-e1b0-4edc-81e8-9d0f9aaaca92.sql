
-- First, disable RLS temporarily to avoid conflicts during cleanup
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Get all policy names and drop them systematically
DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on organization_members
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'organization_members' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.organization_members';
    END LOOP;
    
    -- Drop all policies on projects
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'projects' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.projects';
    END LOOP;
    
    -- Drop all policies on knowledge_entries
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'knowledge_entries' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.knowledge_entries';
    END LOOP;
    
    -- Drop all policies on proposal_sections
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'proposal_sections' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.proposal_sections';
    END LOOP;
    
    -- Drop all policies on profiles
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
    END LOOP;
    
    -- Drop all policies on organizations
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'organizations' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.organizations';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create safe RLS policies for organization_members using direct auth.uid() checks
CREATE POLICY "Users can view their own memberships" 
ON public.organization_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view members of same organization" 
ON public.organization_members 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Create safe policies for projects table
CREATE POLICY "Users can view organization projects" 
ON public.projects 
FOR SELECT 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can insert projects in their organization" 
ON public.projects 
FOR INSERT 
WITH CHECK (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can update organization projects" 
ON public.projects 
FOR UPDATE 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can delete organization projects" 
ON public.projects 
FOR DELETE 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

-- Create policies for knowledge_entries
CREATE POLICY "Users can view organization knowledge entries" 
ON public.knowledge_entries 
FOR SELECT 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can insert knowledge entries in their organization" 
ON public.knowledge_entries 
FOR INSERT 
WITH CHECK (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can update organization knowledge entries" 
ON public.knowledge_entries 
FOR UPDATE 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can delete organization knowledge entries" 
ON public.knowledge_entries 
FOR DELETE 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

-- Create policies for proposal_sections
CREATE POLICY "Users can view organization proposal sections" 
ON public.proposal_sections 
FOR SELECT 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can insert proposal sections in their organization" 
ON public.proposal_sections 
FOR INSERT 
WITH CHECK (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can update organization proposal sections" 
ON public.proposal_sections 
FOR UPDATE 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can delete organization proposal sections" 
ON public.proposal_sections 
FOR DELETE 
USING (public.user_belongs_to_organization(auth.uid(), organization_id));

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (profile_id = auth.uid());

-- Create policies for organizations
CREATE POLICY "Users can view their organizations" 
ON public.organizations 
FOR SELECT 
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);
