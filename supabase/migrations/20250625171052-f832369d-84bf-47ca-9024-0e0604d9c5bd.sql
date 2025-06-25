
-- Add only the new fields that don't already exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_size text,
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS use_case text,
ADD COLUMN IF NOT EXISTS onboarding_segment text;

-- Create organization size enum (drop and recreate if exists)
DROP TYPE IF EXISTS organization_size_type CASCADE;
CREATE TYPE organization_size_type AS ENUM ('solo', 'small_team', 'enterprise', 'white_label');

-- Create industry enum for common industries (drop and recreate if exists)
DROP TYPE IF EXISTS industry_type CASCADE;
CREATE TYPE industry_type AS ENUM (
  'technology',
  'healthcare',
  'finance',
  'education',
  'manufacturing',
  'retail',
  'consulting',
  'real_estate',
  'construction',
  'government',
  'non_profit',
  'other'
);

-- Create use case enum (drop and recreate if exists)
DROP TYPE IF EXISTS use_case_type CASCADE;
CREATE TYPE use_case_type AS ENUM (
  'rfp_response',
  'proposal_management',
  'team_collaboration',
  'enterprise_solution',
  'white_label_integration',
  'other'
);

-- Update organization_size column to use enum (only if it exists as text)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' 
               AND column_name = 'organization_size' 
               AND data_type = 'text') THEN
        ALTER TABLE public.profiles 
        ALTER COLUMN organization_size TYPE organization_size_type 
        USING organization_size::organization_size_type;
    END IF;
END $$;

-- Update industry column to use enum if it's currently text
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' 
               AND column_name = 'industry' 
               AND data_type = 'text') THEN
        ALTER TABLE public.profiles 
        ALTER COLUMN industry TYPE industry_type 
        USING industry::industry_type;
    END IF;
END $$;

-- Update use_case column to use enum (only if it exists as text)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' 
               AND column_name = 'use_case' 
               AND data_type = 'text') THEN
        ALTER TABLE public.profiles 
        ALTER COLUMN use_case TYPE use_case_type 
        USING use_case::use_case_type;
    END IF;
END $$;

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  org_id UUID;
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
    (NEW.raw_user_meta_data->>'birthday')::DATE,
    NEW.email,
    (NEW.raw_user_meta_data->>'organization_size')::organization_size_type,
    (NEW.raw_user_meta_data->>'industry')::industry_type,
    COALESCE((NEW.raw_user_meta_data->>'job_title')::TEXT, ''),
    (NEW.raw_user_meta_data->>'use_case')::use_case_type,
    COALESCE((NEW.raw_user_meta_data->>'onboarding_segment')::TEXT, '')
  );
  
  -- Create default organization for new user
  org_id := public.create_default_organization_for_user(NEW.id);
  
  -- Also automatically assign the 'user' role
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (NEW.id, 'user', NEW.id);
  
  RETURN NEW;
END;
$$;
