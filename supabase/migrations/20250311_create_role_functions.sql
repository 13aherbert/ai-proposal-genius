
-- Create a function to get all user roles by ID
CREATE OR REPLACE FUNCTION public.get_all_user_roles_by_id(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  role TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.id, ur.user_id, ur.role, ur.created_at, ur.created_by
  FROM public.user_roles ur
  WHERE ur.user_id = user_id_param;
END;
$$;
