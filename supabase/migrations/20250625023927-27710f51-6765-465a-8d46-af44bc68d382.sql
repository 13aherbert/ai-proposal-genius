
-- First, let's check if there are any problematic RLS policies causing recursion
-- We'll disable RLS temporarily on projects table to isolate the issue
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Re-enable RLS with simple, non-recursive policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies that don't reference other tables
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Also fix organization_members table RLS policies to prevent recursion
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can manage organization members" ON public.organization_members;

-- Re-enable with simple policies
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies for organization_members
CREATE POLICY "Users can view their own memberships" ON public.organization_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships" ON public.organization_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
