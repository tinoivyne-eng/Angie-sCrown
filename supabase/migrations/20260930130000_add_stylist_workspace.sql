-- Gives each stylist a limited, secure workspace for their own appointments and hours.

create unique index if not exists uq_stylists_profile_id
  on public.stylists(profile_id) where profile_id is not null;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    auth.uid() = id
    or is_admin()
    or exists (
      select 1 from appointments a
      join stylists s on s.id = a.stylist_id
      where a.customer_id = profiles.id and s.profile_id = auth.uid()
    )
  );

create or replace function public.stylist_update_appointment_status(p_appointment_id uuid, p_status appointment_status)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_status not in ('completed', 'no_show') then
    raise exception 'Stylists can only mark appointments completed or no-show';
  end if;

  update appointments
  set status = p_status
  where id = p_appointment_id
    and status = 'confirmed'
    and exists (
      select 1 from stylists
      where stylists.id = appointments.stylist_id
        and stylists.profile_id = auth.uid()
        and stylists.is_active
    );

  if not found then
    raise exception 'You can only update your own confirmed appointments';
  end if;
end;
$$;

revoke all on function public.stylist_update_appointment_status(uuid, appointment_status) from public;
grant execute on function public.stylist_update_appointment_status(uuid, appointment_status) to authenticated;
