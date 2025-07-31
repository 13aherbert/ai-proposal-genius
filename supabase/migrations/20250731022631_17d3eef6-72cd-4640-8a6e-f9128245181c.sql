-- Check current RLS policies on organization_members to understand the recursion issue
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'organization_members';

-- Also check for any remaining problematic functions or policies
\d+ organization_members;