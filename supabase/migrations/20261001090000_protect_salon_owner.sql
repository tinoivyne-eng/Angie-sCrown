-- Protects one salon-owner account from role removal or being disabled.
-- The oldest existing admin is marked as owner automatically.

alter table public.profiles add column if not exists is_owner boolean not null default false;

with owner_profile as (
  select p.id
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where r.name = 'admin'
  order by p.created_at asc
  limit 1
)
update public.profiles
set is_owner = true
where id in (select id from owner_profile)
  and not exists (select 1 from public.profiles where is_owner);

drop policy if exists "profiles_admin_insert_delete" on public.profiles;
create policy "profiles_admin_insert_delete" on public.profiles
  for delete using (is_admin() and not is_owner);

create or replace function public.admin_set_profile_role(target_user_id uuid, new_role_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then raise exception 'Only administrators can change user roles'; end if;
  if new_role_id is not null and not exists (select 1 from roles where id = new_role_id) then raise exception 'The selected role does not exist'; end if;
  if exists (select 1 from profiles where id = target_user_id and is_owner)
     and not exists (select 1 from roles where id = new_role_id and name = 'admin') then
    raise exception 'The salon owner account must remain an active administrator';
  end if;
  update profiles set role_id = new_role_id where id = target_user_id;
  if not found then raise exception 'User profile not found'; end if;
end;
$$;

create or replace function public.admin_set_profile_active(target_user_id uuid, new_is_active boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then raise exception 'Only administrators can change account status'; end if;
  if not new_is_active and exists (select 1 from profiles where id = target_user_id and is_owner) then
    raise exception 'The salon owner account cannot be disabled';
  end if;
  update profiles set is_active = new_is_active where id = target_user_id;
  if not found then raise exception 'User profile not found'; end if;
end;
$$;
