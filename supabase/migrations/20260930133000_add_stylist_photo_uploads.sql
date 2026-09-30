-- Lets admins upload and remove compressed stylist photos in avatars/stylists/.

drop policy if exists "admin_write_stylist_avatars" on storage.objects;
create policy "admin_write_stylist_avatars" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = 'stylists' and is_admin());

drop policy if exists "admin_delete_stylist_avatars" on storage.objects;
create policy "admin_delete_stylist_avatars" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = 'stylists' and is_admin());
