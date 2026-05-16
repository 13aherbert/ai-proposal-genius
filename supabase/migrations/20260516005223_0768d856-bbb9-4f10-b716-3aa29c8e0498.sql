
-- 1. Admin notifications audit log
CREATE TABLE IF NOT EXISTS public.admin_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  recipient_emails TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_notifications_log_dedupe_key_idx
  ON public.admin_notifications_log (event_type, dedupe_key);

CREATE INDEX IF NOT EXISTS admin_notifications_log_created_at_idx
  ON public.admin_notifications_log (created_at DESC);

ALTER TABLE public.admin_notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view notification log"
  ON public.admin_notifications_log
  FOR SELECT
  TO authenticated
  USING (public.is_system_admin() OR public.is_admin_direct());

CREATE POLICY "Service role can write notification log"
  ON public.admin_notifications_log
  FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 2. Security fix: subscriptions table — users may only read their own row.
--    All mutations must come from the Stripe webhook (service role) or admin RPCs.
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
