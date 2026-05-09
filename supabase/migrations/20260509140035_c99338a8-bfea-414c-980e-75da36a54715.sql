-- Restore SELECT for the owning user on per-user subscriptions.
-- The existing RLS policy already restricts to auth.uid() = user_id.
GRANT SELECT (stripe_customer_id, stripe_subscription_id)
  ON public.subscriptions TO authenticated;

-- get_my_stripe_ids() is now redundant; drop it to keep the surface area small.
DROP FUNCTION IF EXISTS public.get_my_stripe_ids();