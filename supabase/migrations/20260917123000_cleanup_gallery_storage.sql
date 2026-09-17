-- Allows admins to remove gallery files when the related gallery item is deleted or replaced.

drop policy if exists "admin_delete_gallery" on storage.objects;
create policy "admin_delete_gallery" on storage.objects
  for delete using (bucket_id = 'gallery' and is_admin());
