-- Revoke client access to Stripe identifiers and verification tokens
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.subscriptions FROM authenticated, anon;
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.organization_subscriptions FROM authenticated, anon;
REVOKE SELECT (stripe_invoice_id) ON public.organization_billing_history FROM authenticated, anon;
REVOKE SELECT (stripe_checkout_session_id, stripe_payment_intent_id, stripe_customer_id) ON public.lifetime_deal_redemptions FROM authenticated, anon;
REVOKE SELECT (verification_token) ON public.organization_domains FROM authenticated, anon;