-- =============================================================================
-- 1) STRIPE IDS — column-level revoke + owner/admin RPCs
-- =============================================================================

REVOKE SELECT (stripe_customer_id, stripe_subscription_id)
  ON public.subscriptions FROM authenticated, anon;

REVOKE SELECT (stripe_customer_id, stripe_subscription_id)
  ON public.organization_subscriptions FROM authenticated, anon;

-- Per-user lookup: only the owning user gets their IDs
CREATE OR REPLACE FUNCTION public.get_my_stripe_ids()
RETURNS TABLE(stripe_customer_id text, stripe_subscription_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.stripe_customer_id, s.stripe_subscription_id
  FROM public.subscriptions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_stripe_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_stripe_ids() TO authenticated;

-- Org lookup: only org owners/admins get the IDs
CREATE OR REPLACE FUNCTION public.get_org_stripe_ids(_org_id uuid)
RETURNS TABLE(stripe_customer_id text, stripe_subscription_id text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_is_org_owner_or_admin(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Not authorized to view billing identifiers for this organization';
  END IF;
  RETURN QUERY
    SELECT os.stripe_customer_id, os.stripe_subscription_id
    FROM public.organization_subscriptions os
    WHERE os.organization_id = _org_id
    LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_org_stripe_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_org_stripe_ids(uuid) TO authenticated;

-- =============================================================================
-- 2) INTEGRATION CREDENTIALS & WEBHOOK SECRETS — encrypted at rest, no client read
-- =============================================================================

-- Add encrypted-payload columns (AES-GCM ciphertext + 12-byte IV, base64-encoded by edge fn).
ALTER TABLE public.organization_integrations
  ADD COLUMN IF NOT EXISTS credentials_ciphertext text,
  ADD COLUMN IF NOT EXISTS credentials_iv text,
  ADD COLUMN IF NOT EXISTS credentials_updated_at timestamptz;

ALTER TABLE public.organization_webhooks
  ADD COLUMN IF NOT EXISTS secret_key_ciphertext text,
  ADD COLUMN IF NOT EXISTS secret_key_iv text,
  ADD COLUMN IF NOT EXISTS secret_key_last4 text,
  ADD COLUMN IF NOT EXISTS secret_key_updated_at timestamptz;

-- Revoke ALL client access to plaintext + ciphertext secret material.
-- Service role (used by edge functions) is unaffected.
REVOKE SELECT, INSERT, UPDATE (credentials, credentials_ciphertext, credentials_iv)
  ON public.organization_integrations FROM authenticated, anon;

REVOKE SELECT, INSERT, UPDATE (secret_key, secret_key_ciphertext, secret_key_iv)
  ON public.organization_webhooks FROM authenticated, anon;

-- Helpful flags so the UI can render "configured ✓" without reading the secret.
ALTER TABLE public.organization_integrations
  ADD COLUMN IF NOT EXISTS has_credentials boolean NOT NULL DEFAULT false;

ALTER TABLE public.organization_webhooks
  ADD COLUMN IF NOT EXISTS has_secret boolean NOT NULL DEFAULT false;