-- Apply after the previous security migrations.
-- Rejects overlapping active appointments for the same stylist at the database level.

create extension if not exists "btree_gist";

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'no_overlapping_active_appointments'
  ) then
    alter table public.appointments
      add constraint no_overlapping_active_appointments
      exclude using gist (
        stylist_id with =,
        tsrange(appointment_date + start_time, appointment_date + end_time, '[)') with &&
      ) where (status not in ('cancelled', 'no_show'));
  end if;
end $$;
