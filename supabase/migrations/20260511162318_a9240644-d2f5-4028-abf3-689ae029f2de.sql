
CREATE TABLE IF NOT EXISTS public.user_feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT NOT NULL UNIQUE,
  user_id UUID NULL,
  organization_id UUID NULL,
  type TEXT NOT NULL CHECK (type IN ('bug','feature','improvement','general','support','contact')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  name TEXT NULL,
  email TEXT NULL,
  company TEXT NULL,
  subject TEXT NULL,
  message TEXT NOT NULL,
  allow_contact BOOLEAN NOT NULL DEFAULT true,
  related_error_id TEXT NULL,
  related_error_message TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ufs_user ON public.user_feedback_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_ufs_status ON public.user_feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_ufs_created_at ON public.user_feedback_submissions(created_at DESC);

CREATE OR REPLACE FUNCTION public.validate_user_feedback_submission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.message IS NULL OR length(trim(NEW.message)) < 10 THEN
    RAISE EXCEPTION 'Message must be at least 10 characters';
  END IF;
  IF length(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'Message must be 5000 characters or less';
  END IF;
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_ufs ON public.user_feedback_submissions;
CREATE TRIGGER trg_validate_ufs
  BEFORE INSERT OR UPDATE ON public.user_feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_feedback_submission();

ALTER TABLE public.user_feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own submissions"
  ON public.user_feedback_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own submissions"
  ON public.user_feedback_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all submissions"
  ON public.user_feedback_submissions FOR SELECT
  TO authenticated
  USING (public.is_admin_direct() OR public.is_system_admin());

CREATE POLICY "Admins can update submissions"
  ON public.user_feedback_submissions FOR UPDATE
  TO authenticated
  USING (public.is_admin_direct() OR public.is_system_admin())
  WITH CHECK (public.is_admin_direct() OR public.is_system_admin());

-- Drop the unused support_tickets table I created earlier in this loop (only if it has the new shape)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='support_tickets' AND column_name='ticket_id'
  ) THEN
    DROP TABLE public.support_tickets CASCADE;
  END IF;
END $$;
