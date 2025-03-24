
insert into storage.buckets (id, name)
values ('knowledge-files', 'knowledge-files')
on conflict (id) do nothing;

create policy "Users can upload files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'knowledge-files');

create policy "Users can view their own files"
on storage.objects for select
to authenticated
using (bucket_id = 'knowledge-files');

-- RFP files bucket
insert into storage.buckets (id, name)
values ('rfp-files', 'rfp-files')
on conflict (id) do nothing;

-- Also add the rfp_documents bucket as an alias
insert into storage.buckets (id, name)
values ('rfp_documents', 'rfp_documents')
on conflict (id) do nothing;

create policy "Users can upload RFP files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'rfp-files');

create policy "Users can view their own RFP files"
on storage.objects for select
to authenticated
using (bucket_id = 'rfp-files');

create policy "Users can delete their own RFP files"
on storage.objects for delete
to authenticated
using (bucket_id = 'rfp-files');

-- Add policies for rfp_documents bucket too
create policy "Users can upload RFP documents"
on storage.objects for insert
to authenticated
with check (bucket_id = 'rfp_documents');

create policy "Users can view their own RFP documents"
on storage.objects for select
to authenticated
using (bucket_id = 'rfp_documents');

create policy "Users can delete their own RFP documents"
on storage.objects for delete
to authenticated
using (bucket_id = 'rfp_documents');
