-- Fix the handle_new_user function to properly handle empty birthday values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile first with new fields
  INSERT INTO public.profiles (
    profile_id, 
    first_name, 
    last_name, 
    business_name, 
    birthday, 
    username,
    organization_size,
    industry,
    job_title,
    use_case,
    onboarding_segment
  )
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'first_name')::TEXT, ''),
    COALESCE((NEW.raw_user_meta_data->>'last_name')::TEXT, ''),
    COALESCE((NEW.raw_user_meta_data->>'company_name')::TEXT, ''),
    CASE 
      WHEN (NEW.raw_user_meta_data->>'birthday') IS NULL OR (NEW.raw_user_meta_data->>'birthday') = '' 
      THEN NULL 
      ELSE (NEW.raw_user_meta_data->>'birthday')::DATE 
    END,
    NEW.email,
    (NEW.raw_user_meta_data->>'organization_size')::organization_size_type,
    (NEW.raw_user_meta_data->>'industry')::industry_type,
    COALESCE((NEW.raw_user_meta_data->>'job_title')::TEXT, ''),
    (NEW.raw_user_meta_data->>'use_case')::use_case_type,
    COALESCE((NEW.raw_user_meta_data->>'onboarding_segment')::TEXT, '')
  );
  
  -- Create default organization for new user
  PERFORM public.create_default_organization_for_user(NEW.id);
  
  -- Also automatically assign the 'user' role
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (NEW.id, 'user', NEW.id);
  
  RETURN NEW;
END;
$$;