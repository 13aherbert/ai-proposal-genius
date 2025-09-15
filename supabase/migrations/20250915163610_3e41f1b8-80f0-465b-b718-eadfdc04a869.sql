-- Fix storage policy to allow service role access to all files
-- This is critical for the edge function to be able to download files for parsing

-- Update the existing service role policy to be more permissive
DROP POLICY IF EXISTS "Service role can access all knowledge files" ON storage.objects;

-- Create a comprehensive service role policy
CREATE POLICY "Service role can access all knowledge files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'knowledge-files')
WITH CHECK (bucket_id = 'knowledge-files');

-- Also ensure authenticated users can still access files in their organization
-- Update the organization members read policy to be more robust
DROP POLICY IF EXISTS "Organization members can read knowledge files" ON storage.objects;

CREATE POLICY "Organization members can read knowledge files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'knowledge-files'
  AND (
    -- Allow access if user uploaded the file (for compatibility)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Allow access if file is linked to a knowledge entry in user's organization
    EXISTS (
      SELECT 1 FROM public.knowledge_entries ke
      JOIN public.organization_members om ON om.organization_id = ke.organization_id
      WHERE ke.file_path = name
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  )
);