
-- Revoke sensitive columns from authenticated/anon roles so they can only be read via service role / RPCs

-- 1. organization_webhooks.secret_key (plaintext signing secret)
REVOKE SELECT (secret_key) ON public.organization_webhooks FROM authenticated;
REVOKE SELECT (secret_key) ON public.organization_webhooks FROM anon;
REVOKE INSERT (secret_key), UPDATE (secret_key) ON public.organization_webhooks FROM authenticated;
REVOKE INSERT (secret_key), UPDATE (secret_key) ON public.organization_webhooks FROM anon;

-- 2. organization_subscriptions Stripe identifiers — accessible only via get_org_stripe_ids RPC
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.organization_subscriptions FROM authenticated;
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.organization_subscriptions FROM anon;

-- 3. organization_domains.verification_token (DNS verification secret)
REVOKE SELECT (verification_token) ON public.organization_domains FROM authenticated;
REVOKE SELECT (verification_token) ON public.organization_domains FROM anon;

-- 4. password_reset_attempts: use auth.email() instead of fragile username join
DROP POLICY IF EXISTS "Users can insert own password reset attempts" ON public.password_reset_attempts;
CREATE POLICY "Users can insert own password reset attempts"
ON public.password_reset_attempts
FOR INSERT
TO authenticated
WITH CHECK (lower(email) = lower(coalesce(auth.email(), (auth.jwt() ->> 'email'))));
