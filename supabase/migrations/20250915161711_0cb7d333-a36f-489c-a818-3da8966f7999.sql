-- Ensure proper storage policies for knowledge-files bucket

-- Drop existing policies and recreate them with proper organization-based access
DROP POLICY IF EXISTS "Users can upload knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete knowledge files" ON storage.objects;

-- Allow users to upload files to their organization's folder in knowledge-files bucket
CREATE POLICY "Organization members can upload knowledge files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.profiles p ON p.profile_id = auth.uid()
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = p.current_organization_id 
    AND om.status = 'active'
  )
);

-- Allow users to read files from their organization's folders
CREATE POLICY "Organization members can read knowledge files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'knowledge-files'
  AND EXISTS (
    SELECT 1 FROM public.knowledge_entries ke
    JOIN public.organization_members om ON om.organization_id = ke.organization_id
    WHERE ke.file_path = name
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  )
);

-- Allow users to update files they have access to through their organization
CREATE POLICY "Organization members can update knowledge files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'knowledge-files'
  AND EXISTS (
    SELECT 1 FROM public.knowledge_entries ke
    JOIN public.organization_members om ON om.organization_id = ke.organization_id
    WHERE ke.file_path = name
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  )
);

-- Allow users to delete files they have access to through their organization
CREATE POLICY "Organization members can delete knowledge files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'knowledge-files'
  AND EXISTS (
    SELECT 1 FROM public.knowledge_entries ke
    JOIN public.organization_members om ON om.organization_id = ke.organization_id
    WHERE ke.file_path = name
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  )
);

-- Also create a policy to allow edge functions to access all files in the bucket
CREATE POLICY "Service role can access all knowledge files"
ON storage.objects
FOR ALL
USING (bucket_id = 'knowledge-files')
WITH CHECK (bucket_id = 'knowledge-files');