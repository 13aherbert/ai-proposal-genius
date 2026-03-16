ALTER TABLE public.organizations
  ADD COLUMN csm_name text DEFAULT 'Your OptiRFP CSM',
  ADD COLUMN csm_email text DEFAULT 'csm@optirfp.ai',
  ADD COLUMN csm_calendly_url text DEFAULT 'https://calendly.com/optirfp-enterprise',
  ADD COLUMN csm_phone text DEFAULT NULL;