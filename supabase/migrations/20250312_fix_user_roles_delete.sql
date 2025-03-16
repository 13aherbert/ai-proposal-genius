
-- Create a more reliable function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin_direct()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Direct query to avoid any recursion through other functions
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) INTO is_admin_user;
  
  RETURN is_admin_user;
END;
$$;

-- Create a service role function to manage user roles deletions for admins
CREATE OR REPLACE FUNCTION public.admin_delete_user_roles(admin_id uuid, target_user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
  rows_deleted INTEGER;
BEGIN
  -- First check if the requestor is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = admin_id
    AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete user roles';
  END IF;
  
  -- Delete the roles for the target user
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id
  RETURNING 1 INTO rows_deleted;
  
  RETURN rows_deleted > 0;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error deleting user roles: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Create an API function to call the service role function while avoiding recursion
CREATE OR REPLACE FUNCTION public.delete_user_roles_as_admin(target_user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.admin_delete_user_roles(auth.uid(), target_user_id);
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error in delete_user_roles_as_admin: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Update admin check functions to ensure they don't trigger recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use the direct check to avoid recursion
  RETURN public.is_admin_direct();
END;
$$;
