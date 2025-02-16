
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
