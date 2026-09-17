-- Apply after 20260917113000_secure_profile_privileges.sql.
-- Booking prices, times, and statuses are calculated and validated in the database.

drop policy if exists "appointments_insert" on public.appointments;
drop policy if exists "appointments_update" on public.appointments;
revoke insert, update on public.appointments from anon, authenticated;

create or replace function public.create_appointment(p_service_id uuid, p_stylist_id uuid, p_appointment_date date, p_start_time time, p_notes text default null)
returns public.appointments
language plpgsql security definer set search_path = public
as $$
declare
  v_price numeric(10,2); v_duration integer; v_end_time time; v_appointment public.appointments;
begin
  if auth.uid() is null then raise exception 'You must be signed in to create an appointment'; end if;
  if p_appointment_date < current_date then raise exception 'Appointments cannot be booked in the past'; end if;
  select price, duration_minutes into v_price, v_duration from services where id = p_service_id and is_active;
  if not found then raise exception 'The selected service is unavailable'; end if;
  if not exists (select 1 from stylists where id = p_stylist_id and is_active) then raise exception 'The selected stylist is unavailable'; end if;
  v_end_time := p_start_time + make_interval(mins => v_duration);
  if v_end_time <= p_start_time then raise exception 'Appointments cannot run past midnight'; end if;
  if not exists (select 1 from working_hours where stylist_id = p_stylist_id and day_of_week = extract(dow from p_appointment_date)::smallint and not is_day_off and start_time <= p_start_time and end_time >= v_end_time) then raise exception 'The selected time is outside this stylist''s working hours'; end if;
  if exists (select 1 from blocked_dates where date = p_appointment_date and (stylist_id = p_stylist_id or stylist_id is null) and (start_time is null or end_time is null or (start_time < v_end_time and end_time > p_start_time))) then raise exception 'The selected time is unavailable'; end if;
  if exists (select 1 from appointments where stylist_id = p_stylist_id and appointment_date = p_appointment_date and status not in ('cancelled', 'no_show') and start_time < v_end_time and end_time > p_start_time) then raise exception 'That time slot was just booked by someone else'; end if;
  insert into appointments (customer_id, stylist_id, service_id, appointment_date, start_time, end_time, status, notes, total_price)
  values (auth.uid(), p_stylist_id, p_service_id, p_appointment_date, p_start_time, v_end_time, 'pending', p_notes, v_price)
  returning * into v_appointment;
  insert into notifications (user_id, type, title, body, data) values (auth.uid(), 'booking', 'Appointment requested', 'Your appointment is pending confirmation.', jsonb_build_object('appointment_id', v_appointment.id));
  return v_appointment;
end;
$$;

create or replace function public.cancel_own_appointment(p_appointment_id uuid)
returns void language plpgsql security definer set search_path = public
as $$ begin
  update appointments set status = 'cancelled' where id = p_appointment_id and customer_id = auth.uid() and status in ('pending', 'confirmed') and appointment_date >= current_date;
  if not found then raise exception 'This appointment cannot be cancelled'; end if;
end; $$;

create or replace function public.admin_update_appointment_status(p_appointment_id uuid, p_status appointment_status)
returns void language plpgsql security definer set search_path = public
as $$ declare v_current_status appointment_status;
begin
  if not is_admin() then raise exception 'Only administrators can update appointment status'; end if;
  select status into v_current_status from appointments where id = p_appointment_id for update;
  if not found then raise exception 'Appointment not found'; end if;
  if (v_current_status = 'pending' and p_status not in ('confirmed', 'cancelled')) or (v_current_status = 'confirmed' and p_status not in ('completed', 'cancelled', 'no_show')) then raise exception 'This status change is not allowed'; end if;
  update appointments set status = p_status where id = p_appointment_id;
end; $$;

revoke all on function public.create_appointment(uuid, uuid, date, time, text) from public;
revoke all on function public.cancel_own_appointment(uuid) from public;
revoke all on function public.admin_update_appointment_status(uuid, appointment_status) from public;
grant execute on function public.create_appointment(uuid, uuid, date, time, text) to authenticated;
grant execute on function public.cancel_own_appointment(uuid) to authenticated;
grant execute on function public.admin_update_appointment_status(uuid, appointment_status) to authenticated;
