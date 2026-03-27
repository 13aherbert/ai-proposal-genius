CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  search_params JSONB NOT NULL DEFAULT '{}',
  alert_frequency TEXT NOT NULL DEFAULT 'daily',
  last_alert_sent TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved searches"
  ON public.saved_searches FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own saved searches"
  ON public.saved_searches FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own saved searches"
  ON public.saved_searches FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own saved searches"
  ON public.saved_searches FOR DELETE TO authenticated
  USING (user_id = auth.uid());