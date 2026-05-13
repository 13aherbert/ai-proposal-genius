
CREATE TABLE IF NOT EXISTS public.lifetime_deal_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  source text DEFAULT 'lifetime-deal-landing',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  issued_code_id uuid REFERENCES public.lifetime_deal_codes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lifetime_deal_leads_email_lower
  ON public.lifetime_deal_leads (lower(email));

ALTER TABLE public.lifetime_deal_leads ENABLE ROW LEVEL SECURITY;

-- Public can insert their own lead (email capture form)
DROP POLICY IF EXISTS "Anyone can submit a lifetime lead" ON public.lifetime_deal_leads;
CREATE POLICY "Anyone can submit a lifetime lead"
ON public.lifetime_deal_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only system admins can read/update/delete
DROP POLICY IF EXISTS "System admins manage leads" ON public.lifetime_deal_leads;
CREATE POLICY "System admins manage leads"
ON public.lifetime_deal_leads FOR SELECT
TO authenticated
USING (public.is_system_admin());

DROP POLICY IF EXISTS "System admins update leads" ON public.lifetime_deal_leads;
CREATE POLICY "System admins update leads"
ON public.lifetime_deal_leads FOR UPDATE
TO authenticated
USING (public.is_system_admin())
WITH CHECK (public.is_system_admin());

DROP POLICY IF EXISTS "System admins delete leads" ON public.lifetime_deal_leads;
CREATE POLICY "System admins delete leads"
ON public.lifetime_deal_leads FOR DELETE
TO authenticated
USING (public.is_system_admin());

CREATE TRIGGER update_lifetime_deal_leads_updated_at
BEFORE UPDATE ON public.lifetime_deal_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
