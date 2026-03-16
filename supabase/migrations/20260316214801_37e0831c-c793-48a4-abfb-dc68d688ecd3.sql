ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS sso_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sso_allow_password_fallback boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sso_auto_redirect boolean DEFAULT false;