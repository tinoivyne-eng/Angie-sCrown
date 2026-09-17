-- Apply this migration in the Supabase SQL Editor for existing databases.
-- It prevents users from changing privileged profile fields from the browser.

revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

create or replace function public.admin_set_profile_role(target_user_id uuid, new_role_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only administrators can change user roles';
  end if;

  if new_role_id is not null and not exists (select 1 from roles where id = new_role_id) then
    raise exception 'The selected role does not exist';
  end if;

  update profiles set role_id = new_role_id where id = target_user_id;
  if not found then
    raise exception 'User profile not found';
  end if;
end;
$$;

create or replace function public.admin_set_profile_active(target_user_id uuid, new_is_active boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only administrators can change account status';
  end if;

  update profiles set is_active = new_is_active where id = target_user_id;
  if not found then
    raise exception 'User profile not found';
  end if;
end;
$$;

revoke all on function public.admin_set_profile_role(uuid, uuid) from public;
revoke all on function public.admin_set_profile_active(uuid, boolean) from public;
grant execute on function public.admin_set_profile_role(uuid, uuid) to authenticated;
grant execute on function public.admin_set_profile_active(uuid, boolean) to authenticated;
