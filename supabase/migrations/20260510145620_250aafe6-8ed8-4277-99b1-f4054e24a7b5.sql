
-- Idempotent column-level REVOKEs for Stripe identifiers and verification tokens.
DO $$ BEGIN
  REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.subscriptions FROM anon, authenticated;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL; END $$;

DO $$ BEGIN
  REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.organization_subscriptions FROM anon, authenticated;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL; END $$;

DO $$ BEGIN
  REVOKE SELECT (stripe_invoice_id) ON public.organization_billing_history FROM anon, authenticated;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL; END $$;

DO $$ BEGIN
  REVOKE SELECT (stripe_customer_id, stripe_checkout_session_id, stripe_payment_intent_id) ON public.lifetime_deal_redemptions FROM anon, authenticated;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL; END $$;

DO $$ BEGIN
  REVOKE SELECT (stripe_price_id) ON public.lifetime_deal_codes FROM anon, authenticated;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL; END $$;

DO $$ BEGIN
  REVOKE SELECT (stripe_price_id) ON public.subscription_plan_templates FROM anon, authenticated;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL; END $$;

DO $$ BEGIN
  REVOKE SELECT (verification_token) ON public.organization_domains FROM anon, authenticated;
EXCEPTION WHEN undefined_column OR undefined_table THEN NULL; END $$;
