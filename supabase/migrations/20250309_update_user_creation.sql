
-- Update the handle_new_user function to set username as email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (profile_id, first_name, last_name, company_name, birthday, username)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'first_name')::TEXT, ''),
    COALESCE((NEW.raw_user_meta_data->>'last_name')::TEXT, ''),
    (NEW.raw_user_meta_data->>'company_name')::TEXT,
    (NEW.raw_user_meta_data->>'birthday')::DATE,
    NEW.email -- Set username to email
  );
  
  -- Also automatically assign the 'user' role
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (NEW.id, 'user', NEW.id);
  
  RETURN NEW;
END;
$$;
