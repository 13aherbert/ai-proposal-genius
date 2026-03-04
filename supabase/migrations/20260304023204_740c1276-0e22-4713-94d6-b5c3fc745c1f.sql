
-- Helper: check if a user belongs to the same org as another user (for knowledge-files bucket)
CREATE OR REPLACE FUNCTION public.storage_user_in_same_org(file_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om2.user_id = file_owner_id
      AND om1.status = 'active'
      AND om2.status = 'active'
  );
$$;

-- Helper: check if user belongs to a given org (for rfp-files bucket)
CREATE OR REPLACE FUNCTION public.storage_user_in_org(org_id_text text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = org_id_text::uuid
      AND om.status = 'active'
  );
$$;

-- ============================================
-- DROP old overly-permissive policies
-- ============================================

-- knowledge-files
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;

-- rfp-files
DROP POLICY IF EXISTS "Users can upload RFP files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own RFP files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own RFP files" ON storage.objects;

-- rfp_documents
DROP POLICY IF EXISTS "Users can upload RFP documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own RFP documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own RFP documents" ON storage.objects;

-- ============================================
-- NEW organization-scoped policies: knowledge-files
-- Path pattern: {userId}/{filename}
-- ============================================

-- SELECT: user can view files owned by anyone in their org
CREATE POLICY "Org members can view knowledge files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'knowledge-files'
  AND public.storage_user_in_same_org(((storage.foldername(name))[1])::uuid)
);

-- INSERT: user can only upload to their own folder
CREATE POLICY "Users can upload own knowledge files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: user can only delete their own files
CREATE POLICY "Users can delete own knowledge files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- NEW organization-scoped policies: rfp-files
-- Path pattern: {orgId}/{userId}/{timestamp}_{filename}
-- ============================================

-- SELECT: user can view files in orgs they belong to
CREATE POLICY "Org members can view RFP files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'rfp-files'
  AND public.storage_user_in_org((storage.foldername(name))[1])
);

-- INSERT: user can upload to orgs they belong to, in their own subfolder
CREATE POLICY "Org members can upload RFP files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rfp-files'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- DELETE: user can delete files in their own subfolder within their org
CREATE POLICY "Org members can delete own RFP files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'rfp-files'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================
-- NEW organization-scoped policies: rfp_documents
-- Same path pattern as rfp-files
-- ============================================

CREATE POLICY "Org members can view RFP documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'rfp_documents'
  AND public.storage_user_in_org((storage.foldername(name))[1])
);

CREATE POLICY "Org members can upload RFP documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rfp_documents'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Org members can delete own RFP documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'rfp_documents'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
);
