
-- Create function to get all user roles without causing recursion
CREATE OR REPLACE FUNCTION public.get_all_user_roles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role text,
  created_at timestamptz,
  created_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.id, ur.user_id, ur.role, ur.created_at, ur.created_by
  FROM public.user_roles ur;
END;
$$;

-- Create function to get all beta invitations without causing recursion
CREATE OR REPLACE FUNCTION public.get_all_beta_invitations()
RETURNS TABLE (
  id uuid,
  email text,
  invite_code text,
  invited_by uuid,
  status text,
  created_at timestamptz,
  accepted_at timestamptz,
  expires_at timestamptz,
  invitation_email_sent boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id, 
    bi.email, 
    bi.invite_code, 
    bi.invited_by,
    bi.status, 
    bi.created_at, 
    bi.accepted_at, 
    bi.expires_at, 
    bi.invitation_email_sent
  FROM public.beta_invitations bi
  ORDER BY bi.created_at DESC;
END;
$$;

-- Create function to check pending invitations by email
CREATE OR REPLACE FUNCTION public.get_pending_invitation_by_email(email_param TEXT)
RETURNS TABLE (
  id uuid,
  email text,
  invite_code text,
  invited_by uuid,
  status text,
  created_at timestamptz,
  accepted_at timestamptz,
  expires_at timestamptz,
  invitation_email_sent boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id, 
    bi.email, 
    bi.invite_code, 
    bi.invited_by,
    bi.status, 
    bi.created_at, 
    bi.accepted_at, 
    bi.expires_at, 
    bi.invitation_email_sent
  FROM public.beta_invitations bi
  WHERE bi.email = email_param
  AND bi.status = 'pending'
  LIMIT 1;
END;
$$;

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
