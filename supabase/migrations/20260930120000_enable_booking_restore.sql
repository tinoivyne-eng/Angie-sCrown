-- Allows an admin to restore a declined booking only when its original time remains free.

create or replace function public.admin_update_appointment_status(p_appointment_id uuid, p_status appointment_status)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_current_status appointment_status;
  v_stylist_id uuid;
  v_appointment_date date;
  v_start_time time;
  v_end_time time;
begin
  if not is_admin() then raise exception 'Only administrators can update appointment status'; end if;

  select status, stylist_id, appointment_date, start_time, end_time
  into v_current_status, v_stylist_id, v_appointment_date, v_start_time, v_end_time
  from appointments where id = p_appointment_id for update;
  if not found then raise exception 'Appointment not found'; end if;

  if (v_current_status = 'pending' and p_status not in ('confirmed', 'cancelled'))
     or (v_current_status = 'confirmed' and p_status not in ('completed', 'cancelled', 'no_show'))
     or (v_current_status = 'cancelled' and p_status <> 'pending') then
    raise exception 'This status change is not allowed';
  end if;

  if v_current_status = 'cancelled' and exists (
    select 1 from appointments
    where id <> p_appointment_id
      and stylist_id = v_stylist_id
      and appointment_date = v_appointment_date
      and status not in ('cancelled', 'no_show')
      and start_time < v_end_time
      and end_time > v_start_time
  ) then
    raise exception 'This booking cannot be restored because its original time is no longer available';
  end if;

  update appointments set status = p_status where id = p_appointment_id;
end;
$$;
