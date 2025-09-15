-- CRITICAL SECURITY FIX: Remove public access to beta_invitations table
-- This fixes the email address exposure vulnerability

-- First, drop the problematic policy that allows public access
DROP POLICY IF EXISTS "Everyone can verify their own invitation code" ON public.beta_invitations;

-- Create a secure function to verify invitation codes without exposing email addresses
CREATE OR REPLACE FUNCTION public.verify_invitation_code_secure(code_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only return true/false, never expose email addresses or other sensitive data
  RETURN EXISTS (
    SELECT 1 
    FROM public.beta_invitations 
    WHERE invite_code = code_param 
      AND status = 'pending' 
      AND expires_at > NOW()
  );
END;
$$;

-- Create a secure function for getting invitation details (only for the specific invited user)
CREATE OR REPLACE FUNCTION public.get_invitation_for_email(email_param text, code_param text)
RETURNS TABLE(id uuid, invite_code text, status text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only return invitation details if both email and code match exactly
  -- This prevents email enumeration attacks
  RETURN QUERY
  SELECT 
    bi.id,
    bi.invite_code,
    bi.status,
    bi.expires_at
  FROM public.beta_invitations bi
  WHERE bi.email = email_param 
    AND bi.invite_code = code_param
    AND bi.status = 'pending'
    AND bi.expires_at > NOW();
END;
$$;

-- Ensure the table has proper RLS policies for admin-only access
-- Remove any duplicate admin policies and consolidate them
DROP POLICY IF EXISTS "Admin users can insert invitations" ON public.beta_invitations;
DROP POLICY IF EXISTS "Admin users can update invitations" ON public.beta_invitations;
DROP POLICY IF EXISTS "Admin users can view all invitations" ON public.beta_invitations;
DROP POLICY IF EXISTS "Admins can insert beta invitations" ON public.beta_invitations;
DROP POLICY IF EXISTS "Admins can update beta invitations" ON public.beta_invitations;
DROP POLICY IF EXISTS "Admins manage beta invitations direct" ON public.beta_invitations;
DROP POLICY IF EXISTS "Admins view beta invitations direct" ON public.beta_invitations;

-- Create clean, secure admin-only policies
CREATE POLICY "Admins only can manage beta invitations"
ON public.beta_invitations
FOR ALL
USING (is_admin_direct())
WITH CHECK (is_admin_direct());

-- Add logging for security audit
CREATE OR REPLACE FUNCTION public.log_invitation_verification(code_param text, success boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log verification attempts for security monitoring
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    details
  ) VALUES (
    'invitation_verification',
    auth.uid(),
    jsonb_build_object(
      'code_verified', success,
      'timestamp', NOW(),
      'ip_address', inet_client_addr()
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If logging fails, don't break the verification process
    NULL;
END;
$$;

-- Add comment explaining the security model
COMMENT ON TABLE public.beta_invitations IS 
'Beta invitations table with strict admin-only RLS policies. Public access removed to prevent email harvesting attacks.';