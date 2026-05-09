
CREATE TABLE public.email_unsubscribes (
  email text PRIMARY KEY,
  token text NOT NULL,
  unsubscribed_at timestamptz NOT NULL DEFAULT now(),
  source text,
  user_agent text,
  ip text
);

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (edge functions) can access.

CREATE OR REPLACE FUNCTION public.has_unsubscribed(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.email_unsubscribes
    WHERE email = lower(_email)
  );
$$;
