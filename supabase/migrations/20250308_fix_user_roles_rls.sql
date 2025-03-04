
-- First, let's check and drop any problematic RLS policies on the user_roles table
DROP POLICY IF EXISTS "Users can manage their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Ensure RLS is enabled on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a safe policy for selecting roles that won't cause recursion
-- This policy uses USING instead of CHECK to prevent recursion
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Create an admin policy that uses the is_admin function directly
-- This function is SECURITY DEFINER so it won't cause recursion
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin());

-- Create a policy for admins to insert, update, delete
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin());
