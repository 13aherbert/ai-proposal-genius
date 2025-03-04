
-- Create or replace function to directly check if a user exists in user_roles
CREATE OR REPLACE FUNCTION public.check_user_role(user_id_param UUID, role_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_id_param
    AND role = role_param
  ) INTO role_exists;
  
  RETURN role_exists;
END;
$$;

-- Create or replace function to check if a user has a role
-- This is a TypeScript-friendly function that replaces check_user_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  ) INTO role_exists;
  
  RETURN role_exists;
END;
$$;
