
insert into storage.buckets (id, name)
values ('knowledge-files', 'knowledge-files')
on conflict (id) do nothing;

-- Knowledge files: org-scoped access via user folder path ({userId}/{filename})
create policy "Org members can view knowledge files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'knowledge-files'
  AND public.storage_user_in_same_org(((storage.foldername(name))[1])::uuid)
);

create policy "Users can upload own knowledge files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'knowledge-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own knowledge files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'knowledge-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RFP files bucket
insert into storage.buckets (id, name)
values ('rfp-files', 'rfp-files')
on conflict (id) do nothing;

-- Also add the rfp_documents bucket as an alias
insert into storage.buckets (id, name)
values ('rfp_documents', 'rfp_documents')
on conflict (id) do nothing;

-- RFP files: org-scoped access via org folder path ({orgId}/{userId}/{file})
create policy "Org members can view RFP files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'rfp-files'
  AND public.storage_user_in_org((storage.foldername(name))[1])
);

create policy "Org members can upload RFP files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'rfp-files'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
);

create policy "Org members can delete own RFP files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'rfp-files'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policies for rfp_documents bucket (same pattern)
create policy "Org members can view RFP documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'rfp_documents'
  AND public.storage_user_in_org((storage.foldername(name))[1])
);

create policy "Org members can upload RFP documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'rfp_documents'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
);

create policy "Org members can delete own RFP documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'rfp_documents'
  AND public.storage_user_in_org((storage.foldername(name))[1])
  AND (storage.foldername(name))[2] = auth.uid()::text
);
