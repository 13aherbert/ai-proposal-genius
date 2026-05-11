
-- 1. Domain verification: add verified_at and ensure verification_token has a default
ALTER TABLE public.organization_domains
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Backfill default verification tokens for existing rows that lack one
UPDATE public.organization_domains
   SET verification_token = encode(gen_random_bytes(24), 'hex')
 WHERE verification_token IS NULL OR verification_token = '';

ALTER TABLE public.organization_domains
  ALTER COLUMN verification_token SET DEFAULT encode(gen_random_bytes(24), 'hex');

ALTER TABLE public.organization_domains
  ALTER COLUMN verification_token SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organization_domains_domain_verified
  ON public.organization_domains(domain) WHERE is_verified = true;

-- 2. SSO handoff tokens: short-lived, single-use server-issued tokens that authorize
-- the sso-auth-callback function to actually mint a session for an email.
-- These are created ONLY by trusted server-side validators (Path A post-login or Path B OIDC).
CREATE TABLE IF NOT EXISTS public.sso_handoff_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  provider TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sso_handoff_tokens ENABLE ROW LEVEL SECURITY;

-- No client access — only edge functions using service role read/write this table
CREATE POLICY "deny all client access on sso_handoff_tokens"
  ON public.sso_handoff_tokens FOR ALL
  USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_sso_handoff_tokens_expires
  ON public.sso_handoff_tokens(expires_at) WHERE consumed_at IS NULL;

-- 3. Per-IP/email rate limit log for SSO-related endpoints
CREATE TABLE IF NOT EXISTS public.sso_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sso_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all client access on sso_rate_limits"
  ON public.sso_rate_limits FOR ALL
  USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_sso_rate_limits_bucket
  ON public.sso_rate_limits(bucket_key, endpoint, attempted_at DESC);

-- 4. Helper: count SSO requests in a window (called by edge functions via service role)
CREATE OR REPLACE FUNCTION public.sso_check_rate_limit(
  _bucket_key TEXT,
  _endpoint TEXT,
  _max_attempts INT,
  _window_seconds INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
    FROM public.sso_rate_limits
   WHERE bucket_key = _bucket_key
     AND endpoint = _endpoint
     AND attempted_at > now() - make_interval(secs => _window_seconds);

  IF recent_count >= _max_attempts THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.sso_rate_limits(bucket_key, endpoint) VALUES (_bucket_key, _endpoint);

  -- Opportunistic cleanup of stale rows
  DELETE FROM public.sso_rate_limits
   WHERE attempted_at < now() - INTERVAL '1 day';

  RETURN TRUE;
END;
$$;

-- 5. organization_sso_config: ensure configuration column exists; nothing structural to add.
-- We will store new optional keys inside `configuration` JSONB:
--   supabase_provider_id, default_role, role_mapping (Path A)
--   client_id, discovery_url, redirect_uri, jwks_uri, token_endpoint, authorize_endpoint, issuer (Path B)
-- The existing manage-sso-config function already masks sensitive keys (client_secret, etc.).
