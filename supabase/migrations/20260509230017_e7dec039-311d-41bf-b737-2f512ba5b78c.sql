
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL DEFAULT 'error',
  source TEXT NOT NULL DEFAULT 'frontend',
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  url TEXT,
  user_agent TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON public.error_logs(source);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (public.is_system_admin());

CREATE POLICY "System admins can delete error logs"
  ON public.error_logs FOR DELETE
  TO authenticated
  USING (public.is_system_admin());

CREATE POLICY "Authenticated users can insert error logs"
  ON public.error_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
