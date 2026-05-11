-- 1) Encrypted OIDC client secrets storage (no client access)
CREATE TABLE IF NOT EXISTS public.sso_client_secrets (
  sso_config_id uuid PRIMARY KEY REFERENCES public.organization_sso_config(id) ON DELETE CASCADE,
  ciphertext bytea NOT NULL,
  iv bytea NOT NULL,
  set_by uuid,
  last_set_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sso_client_secrets ENABLE ROW LEVEL SECURITY;

-- Deny-all RLS: only service role (which bypasses RLS) can touch this table
CREATE POLICY "deny all sso_client_secrets" ON public.sso_client_secrets
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- 2) Strip any pre-existing plaintext client_secret from JSON configuration
UPDATE public.organization_sso_config
   SET configuration = configuration - 'client_secret'
 WHERE provider_type = 'oidc'
   AND configuration ? 'client_secret';