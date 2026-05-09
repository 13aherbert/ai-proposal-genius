
-- Lifetime deal codes
CREATE TABLE public.lifetime_deal_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  stripe_price_id text NOT NULL,
  plan_slug text NOT NULL DEFAULT 'growth',
  max_redemptions integer,
  redemption_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lifetime_deal_codes_code ON public.lifetime_deal_codes(code);

ALTER TABLE public.lifetime_deal_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins manage lifetime codes"
ON public.lifetime_deal_codes FOR ALL
TO authenticated
USING (public.is_system_admin())
WITH CHECK (public.is_system_admin());

-- Lifetime deal redemptions
CREATE TABLE public.lifetime_deal_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.lifetime_deal_codes(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  email text,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text UNIQUE,
  amount_paid_cents integer,
  currency text DEFAULT 'usd',
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  refunded_at timestamptz
);
CREATE INDEX idx_lifetime_redemptions_user ON public.lifetime_deal_redemptions(user_id);
CREATE INDEX idx_lifetime_redemptions_code ON public.lifetime_deal_redemptions(code_id);

ALTER TABLE public.lifetime_deal_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own redemptions"
ON public.lifetime_deal_redemptions FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_system_admin());

-- Subscriptions: lifetime entitlement columns
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS is_lifetime boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lifetime_redemption_id uuid REFERENCES public.lifetime_deal_redemptions(id);

-- RPC: public code validation
CREATE OR REPLACE FUNCTION public.validate_lifetime_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.lifetime_deal_codes%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM public.lifetime_deal_codes WHERE code = _code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF NOT rec.is_active THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'inactive');
  END IF;

  IF rec.expires_at IS NOT NULL AND rec.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  IF rec.max_redemptions IS NOT NULL AND rec.redemption_count >= rec.max_redemptions THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'sold_out');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code_id', rec.id,
    'plan_slug', rec.plan_slug,
    'price_id', rec.stripe_price_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_lifetime_code(text) TO anon, authenticated;

-- RPC: atomically claim a redemption slot (used by webhook with service role)
CREATE OR REPLACE FUNCTION public.claim_lifetime_code_slot(_code_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated integer;
BEGIN
  UPDATE public.lifetime_deal_codes
     SET redemption_count = redemption_count + 1,
         updated_at = now()
   WHERE id = _code_id
     AND is_active = true
     AND (expires_at IS NULL OR expires_at > now())
     AND (max_redemptions IS NULL OR redemption_count < max_redemptions);
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_lifetime_code_slot(uuid) FROM PUBLIC;
