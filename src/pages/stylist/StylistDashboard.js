import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { formatDateLabel, formatTimeLabel, toDateString } from '../../lib/time';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StylistDashboard() {
  const { user } = useAuth();
  const [stylist, setStylist] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    const { data: stylistData, error: stylistError } = await supabase
      .from('stylists')
      .select('*')
      .eq('profile_id', user.id)
      .single();
    if (stylistError || !stylistData) {
      setError('Your account is not linked to a stylist profile yet. Please ask an administrator to link it in Admin → Stylists.');
      setLoading(false);
      return;
    }

    const [appointmentResult, hoursResult] = await Promise.all([
      supabase
        .from('appointments')
        .select('*, services(name), profiles(full_name, email, phone)')
        .eq('stylist_id', stylistData.id)
        .order('appointment_date')
        .order('start_time'),
      supabase.from('working_hours').select('*').eq('stylist_id', stylistData.id),
    ]);
    setStylist(stylistData);
    setAppointments(appointmentResult.data || []);

    const byDay = {};
    (hoursResult.data || []).forEach((hour) => { byDay[hour.day_of_week] = hour; });
    setHours(DAYS.map((_, day) => byDay[day] || {
      stylist_id: stylistData.id,
      day_of_week: day,
      start_time: '09:00:00',
      end_time: '18:00:00',
      is_day_off: day === 0 || day === 1,
    }));
    setLoading(false);
  }, [user]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const today = toDateString(new Date());
  const todayAppointments = useMemo(() => appointments.filter((appointment) => appointment.appointment_date === today && appointment.status !== 'cancelled'), [appointments, today]);
  const upcoming = useMemo(() => appointments.filter((appointment) => appointment.appointment_date >= today && !['cancelled', 'completed', 'no_show'].includes(appointment.status)), [appointments, today]);

  const updateStatus = async (appointmentId, status) => {
    setUpdatingId(appointmentId);
    setError('');
    const { error: updateError } = await supabase.rpc('stylist_update_appointment_status', {
      p_appointment_id: appointmentId,
      p_status: status,
    });
    setUpdatingId(null);
    if (updateError) { setError(updateError.message); return; }
    setAppointments((previous) => previous.map((appointment) => (
      appointment.id === appointmentId ? { ...appointment, status } : appointment
    )));
  };

  const saveHours = async () => {
    setSavingHours(true);
    setError('');
    const { error: hoursError } = await supabase.from('working_hours').upsert(hours, { onConflict: 'stylist_id,day_of_week' });
    setSavingHours(false);
    if (hoursError) { setError(hoursError.message); return; }
    setSuccess('Working hours updated.');
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const AppointmentCard = ({ appointment }) => (
    <div className="bg-surface border border-line rounded-md p-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-heading text-lg text-ink">{appointment.services?.name || 'Service'}</p>
        <p className="font-body text-sm text-muted">{formatDateLabel(appointment.appointment_date)} at {formatTimeLabel(appointment.start_time)}</p>
        <p className="font-body text-sm text-ink mt-2">{appointment.profiles?.full_name || 'Customer'}</p>
        <p className="font-body text-xs text-muted">{appointment.profiles?.email}{appointment.profiles?.phone ? ` · ${appointment.profiles.phone}` : ''}</p>
        {appointment.notes && <p className="font-body text-sm text-muted mt-2">Note: {appointment.notes}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={appointment.status} />
        {appointment.status === 'confirmed' && (
          <>
            <button disabled={updatingId === appointment.id} onClick={() => updateStatus(appointment.id, 'completed')} className="font-body text-xs font-semibold text-primary hover:text-primary-dark disabled:opacity-50">Complete</button>
            <button disabled={updatingId === appointment.id} onClick={() => updateStatus(appointment.id, 'no_show')} className="font-body text-xs font-semibold text-danger hover:text-danger/80 disabled:opacity-50">No-show</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Stylist workspace</p>
        <h1 className="font-heading text-4xl text-ink">Hello, {stylist?.full_name}</h1>
        <p className="font-body text-muted mt-2">Manage your own appointments and weekly working hours.</p>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      <section className="mb-10">
        <h2 className="font-heading text-xl text-ink mb-4">Today&apos;s appointments</h2>
        {todayAppointments.length ? <div className="flex flex-col gap-3">{todayAppointments.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)}</div> : <EmptyState title="No appointments today" description="Enjoy the space in your schedule." />}
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-xl text-ink mb-4">Upcoming appointments</h2>
        {upcoming.length ? <div className="flex flex-col gap-3">{upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)}</div> : <EmptyState title="No upcoming appointments" />}
      </section>

      <section className="bg-surface border border-line rounded-md p-6">
        <h2 className="font-heading text-xl text-ink mb-1">My working hours</h2>
        <p className="font-body text-sm text-muted mb-5">These hours determine when customers can book you.</p>
        <div className="flex flex-col gap-3">
          {hours.map((hour, index) => (
            <div key={hour.day_of_week} className="flex flex-wrap items-center gap-3">
              <span className="font-body text-sm text-ink w-10">{DAYS[hour.day_of_week]}</span>
              <label className="flex items-center gap-1.5 font-body text-xs text-muted"><input type="checkbox" checked={hour.is_day_off} onChange={(event) => { const next = [...hours]; next[index] = { ...hour, is_day_off: event.target.checked }; setHours(next); }} /> Day off</label>
              <input type="time" disabled={hour.is_day_off} value={hour.start_time?.slice(0, 5)} onChange={(event) => { const next = [...hours]; next[index] = { ...hour, start_time: `${event.target.value}:00` }; setHours(next); }} className="border border-line rounded-sm px-2 py-1.5 font-body text-sm disabled:opacity-40" />
              <span className="font-body text-sm text-muted">to</span>
              <input type="time" disabled={hour.is_day_off} value={hour.end_time?.slice(0, 5)} onChange={(event) => { const next = [...hours]; next[index] = { ...hour, end_time: `${event.target.value}:00` }; setHours(next); }} className="border border-line rounded-sm px-2 py-1.5 font-body text-sm disabled:opacity-40" />
            </div>
          ))}
          <button type="button" onClick={saveHours} disabled={savingHours} className="mt-3 self-start font-body font-semibold bg-primary text-white px-5 py-2.5 rounded-sm hover:bg-primary-dark disabled:opacity-60">{savingHours ? 'Saving…' : 'Save Working Hours'}</button>
        </div>
      </section>
    </div>
  );
}
