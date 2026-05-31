
-- 1) Restrict stripe_price_id on subscription_plan_templates from authenticated readers
REVOKE SELECT (stripe_price_id) ON public.subscription_plan_templates FROM authenticated;
REVOKE SELECT (stripe_price_id) ON public.subscription_plan_templates FROM anon;

-- 2) Restrict verification_token column on organization_domains; reads must go through
--    the SECURITY DEFINER RPC get_organization_domain_verification_token which enforces admin checks.
REVOKE SELECT (verification_token) ON public.organization_domains FROM authenticated;
REVOKE SELECT (verification_token) ON public.organization_domains FROM anon;

-- 3) Add explicit restrictive UPDATE policies for rfp-files / rfp_documents storage buckets
DROP POLICY IF EXISTS "Org members can update RFP files" ON storage.objects;
CREATE POLICY "Org members can update RFP files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'rfp-files'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'rfp-files'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Org members can update RFP documents" ON storage.objects;
CREATE POLICY "Org members can update RFP documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'rfp_documents'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'rfp_documents'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
);
