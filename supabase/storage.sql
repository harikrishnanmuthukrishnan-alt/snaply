-- Snaply Storage buckets and policies
-- Run after schema.sql in the Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('videos', 'videos', true)
on conflict (id) do nothing;

-- Public read (media URLs are used in the app)
drop policy if exists "snaply_public_read" on storage.objects;
create policy "snaply_public_read"
on storage.objects for select
to public
using (bucket_id in ('avatars', 'posts', 'stories', 'videos'));

-- Authenticated users may upload into their own folder: {user_id}/filename
drop policy if exists "snaply_insert_own_folder" on storage.objects;
create policy "snaply_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('avatars', 'posts', 'stories', 'videos')
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "snaply_update_own_folder" on storage.objects;
create policy "snaply_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id in ('avatars', 'posts', 'stories', 'videos')
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id in ('avatars', 'posts', 'stories', 'videos')
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "snaply_delete_own_folder" on storage.objects;
create policy "snaply_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('avatars', 'posts', 'stories', 'videos')
  and split_part(name, '/', 1) = auth.uid()::text
);
