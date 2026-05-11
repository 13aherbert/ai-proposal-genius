
-- Support tickets table for in-app feedback / bug / support / contact submissions
CREATE TABLE IF NOT EXISTS public.support_tickets (
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

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- Validation trigger (avoid CHECK constraints with non-immutable funcs)
CREATE OR REPLACE FUNCTION public.validate_support_ticket()
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

DROP TRIGGER IF EXISTS trg_validate_support_ticket ON public.support_tickets;
CREATE TRIGGER trg_validate_support_ticket
  BEFORE INSERT OR UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.validate_support_ticket();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert tickets owned by themselves
CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins / system_admins can view all
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (public.is_admin_direct() OR public.is_system_admin());

-- Admins / system_admins can update status
CREATE POLICY "Admins can update tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (public.is_admin_direct() OR public.is_system_admin())
  WITH CHECK (public.is_admin_direct() OR public.is_system_admin());

-- Note: anonymous (contact form) inserts handled server-side via edge function with service role.
