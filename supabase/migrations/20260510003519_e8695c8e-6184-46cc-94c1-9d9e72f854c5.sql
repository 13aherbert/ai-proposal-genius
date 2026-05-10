-- 1. Remove plaintext credentials column from organization_integrations
ALTER TABLE public.organization_integrations DROP COLUMN IF EXISTS credentials;

-- 2. Revoke column-level SELECT on Stripe IDs from authenticated/anon roles
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.subscriptions FROM anon, authenticated;
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.organization_subscriptions FROM anon, authenticated;
REVOKE SELECT (stripe_customer_id, stripe_checkout_session_id, stripe_payment_intent_id) ON public.lifetime_deal_redemptions FROM anon, authenticated;
REVOKE SELECT (stripe_invoice_id) ON public.organization_billing_history FROM anon, authenticated;

-- 3. Revoke verification_token from clients on organization_domains
REVOKE SELECT (verification_token) ON public.organization_domains FROM anon, authenticated;

-- 4. SECURITY DEFINER RPC to fetch verification token for org owners/admins only
CREATE OR REPLACE FUNCTION public.get_organization_domain_verification_token(_domain_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_id uuid;
  _token text;
BEGIN
  SELECT organization_id, verification_token
    INTO _org_id, _token
    FROM public.organization_domains
   WHERE id = _domain_id;

  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'Domain not found';
  END IF;

  IF NOT public.user_is_org_owner_or_admin(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Not authorized to view verification token for this domain';
  END IF;

  RETURN _token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_organization_domain_verification_token(uuid) TO authenticated;