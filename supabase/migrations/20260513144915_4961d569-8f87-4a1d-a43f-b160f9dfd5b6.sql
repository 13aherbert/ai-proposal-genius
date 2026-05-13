INSERT INTO public.lifetime_deal_codes (code, stripe_price_id, plan_slug, max_redemptions, is_active)
VALUES ('LTD26', 'price_1TVIwDCcQ0GhLgJoncasG3F2', 'growth', 100, true)
ON CONFLICT (code) DO UPDATE SET max_redemptions = EXCLUDED.max_redemptions, is_active = true, updated_at = now();