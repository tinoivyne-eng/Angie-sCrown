import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import {
  addDays,
  formatDateLabel,
  formatTimeLabel,
  generateSlots,
  timeToMinutes,
  toDateString,
} from '../lib/time';

const STEPS = ['Service', 'Stylist', 'Date & Time', 'Confirm'];
const DAYS_AHEAD = 14;

export default function Booking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');

  const [slotsByDate, setSlotsByDate] = useState({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  // Initial load: services + stylists, honoring ?service= and ?stylist=
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        setError('Booking needs Supabase configured before services and stylists can load.');
        return;
      }

      const [svcRes, stylistRes] = await Promise.all([
        supabase.from('services').select('*, categories(name)').eq('is_active', true).order('name'),
        supabase.from('stylists').select('*').eq('is_active', true).order('full_name'),
      ]);
      if (!mounted) return;
      const svcList = svcRes.data || [];
      const stylistList = stylistRes.data || [];
      setServices(svcList);
      setStylists(stylistList);

      const preService = searchParams.get('service');
      const preStylist = searchParams.get('stylist');
      const foundService = svcList.find((s) => s.id === preService);
      const foundStylist = stylistList.find((s) => s.id === preStylist);
      if (foundService) setSelectedService(foundService);
      if (foundStylist) setSelectedStylist(foundStylist);
      if (foundService && !foundStylist) setStep(1);
      if (foundService && foundStylist) setStep(2);

      setLoading(false);
    }
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eligibleStylists = useMemo(() => stylists, [stylists]);

  const upcomingDates = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= DAYS_AHEAD; i++) arr.push(addDays(new Date(), i));
    return arr;
  }, []);

  // Load availability for the selected stylist across the upcoming date range
  useEffect(() => {
    if (!isSupabaseConfigured || !selectedStylist || !selectedService) return;
    let mounted = true;
    setSlotsLoading(true);

    async function loadAvailability() {
      const dateStrings = upcomingDates.map(toDateString);
      const [whRes, apptRes, blockedRes] = await Promise.all([
        supabase.from('working_hours').select('*').eq('stylist_id', selectedStylist.id),
        supabase
          .from('appointments')
          .select('appointment_date, start_time, end_time, status')
          .eq('stylist_id', selectedStylist.id)
          .in('appointment_date', dateStrings)
          .not('status', 'in', '("cancelled","no_show")'),
        supabase
          .from('blocked_dates')
          .select('date, start_time, end_time, stylist_id')
          .in('date', dateStrings)
          .or(`stylist_id.eq.${selectedStylist.id},stylist_id.is.null`),
      ]);
      if (!mounted) return;

      const workingHoursByDow = {};
      (whRes.data || []).forEach((wh) => { workingHoursByDow[wh.day_of_week] = wh; });

      const busyByDate = {};
      (apptRes.data || []).forEach((a) => {
        busyByDate[a.appointment_date] = busyByDate[a.appointment_date] || [];
        busyByDate[a.appointment_date].push({ start: timeToMinutes(a.start_time), end: timeToMinutes(a.end_time) });
      });
      (blockedRes.data || []).forEach((b) => {
        busyByDate[b.date] = busyByDate[b.date] || [];
        const start = b.start_time ? timeToMinutes(b.start_time) : 0;
        const end = b.end_time ? timeToMinutes(b.end_time) : 24 * 60;
        busyByDate[b.date].push({ start, end });
      });

      const duration = selectedStylist.duration_override_minutes || selectedService.duration_minutes;
      const result = {};
      upcomingDates.forEach((d) => {
        const dateStr = toDateString(d);
        const dow = d.getDay();
        const wh = workingHoursByDow[dow];
        const busy = busyByDate[dateStr] || [];
        result[dateStr] = generateSlots(wh, busy, duration);
      });

      setSlotsByDate(result);
      const firstAvailable = upcomingDates.map(toDateString).find((ds) => result[ds]?.length > 0);
      setSelectedDate((prev) => prev || firstAvailable || null);
      setSlotsLoading(false);
    }
    loadAvailability();
    return () => { mounted = false; };
  }, [selectedStylist, selectedService, upcomingDates]);

  const currentSlots = selectedDate ? slotsByDate[selectedDate] || [] : [];

  const handleConfirm = async () => {
    setError('');
    if (!isSupabaseConfigured) {
      setError('Booking needs Supabase configured before appointments can be created.');
      return;
    }
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!selectedService || !selectedStylist || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    const duration = selectedService.duration_minutes;
    const startMinutes = timeToMinutes(selectedTime);
    const endTime = `${Math.floor((startMinutes + duration) / 60).toString().padStart(2, '0')}:${((startMinutes + duration) % 60).toString().padStart(2, '0')}:00`;

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        customer_id: user.id,
        stylist_id: selectedStylist.id,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        status: 'pending',
        notes: notes || null,
        total_price: selectedService.price,
      })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      setError(
        error.code === '23505'
          ? 'That time slot was just booked by someone else. Please choose another.'
          : error.message
      );
      return;
    }

    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'booking',
      title: 'Appointment requested',
      body: `Your ${selectedService.name} with ${selectedStylist.full_name} on ${formatDateLabel(selectedDate)} is pending confirmation.`,
      data: { appointment_id: data.id },
    });

    setConfirmedAppointment(data);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (confirmedAppointment) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <div className="h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl text-ink mb-3">Request sent!</h1>
        <p className="font-body text-muted mb-8">
          We&apos;ve requested your <span className="text-ink font-medium">{selectedService.name}</span> with{' '}
          <span className="text-ink font-medium">{selectedStylist.full_name}</span> on{' '}
          <span className="text-ink font-medium">{formatDateLabel(selectedDate)} at {formatTimeLabel(selectedTime)}</span>.
          You&apos;ll get a notification once it&apos;s confirmed.
        </p>
        <Link to="/appointments" className="font-body font-semibold bg-primary text-white px-7 py-3 rounded-sm hover:bg-primary-dark transition-colors">
          View My Appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Book</p>
        <h1 className="font-heading text-4xl text-ink">Book Your Appointment</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-body text-sm font-semibold ${
                  i === step ? 'bg-primary text-white' : i < step ? 'bg-primary/20 text-primary' : 'bg-line text-muted'
                }`}
              >
                {i + 1}
              </div>
              <span className="font-body text-xs text-muted hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-px w-8 sm:w-16 ${i < step ? 'bg-primary' : 'bg-line'}`} />}
          </React.Fragment>
        ))}
      </div>

      {!user && (
        <Alert type="info">
          You can browse and pick a time now — we&apos;ll ask you to{' '}
          <Link to="/login" state={{ from: location }} className="underline font-semibold">sign in</Link> before confirming.
        </Alert>
      )}

      <div className="mt-6">
        {/* Step 0: service */}
        {step === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedService(s); setStep(1); }}
                className={`text-left bg-surface border rounded-md p-5 hover:shadow-medium transition-shadow ${
                  selectedService?.id === s.id ? 'border-primary ring-1 ring-primary' : 'border-line'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-heading text-lg text-ink">{s.name}</h3>
                  <span className="font-heading text-primary">${Number(s.price).toFixed(0)}</span>
                </div>
                <p className="font-body text-xs text-muted mt-1">{s.duration_minutes} min · {s.categories?.name}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: stylist */}
        {step === 1 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {eligibleStylists.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStylist(s); setSelectedDate(null); setSelectedTime(null); setStep(2); }}
                  className={`text-left bg-surface border rounded-md p-5 flex gap-4 items-center hover:shadow-medium transition-shadow ${
                    selectedStylist?.id === s.id ? 'border-primary ring-1 ring-primary' : 'border-line'
                  }`}
                >
                  <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <span className="font-heading text-xl text-primary/60">{s.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-lg text-ink">{s.full_name}</h3>
                    <p className="font-body text-xs text-muted">
                      {s.rating_count > 0 ? `★ ${s.rating_avg.toFixed(1)}` : 'New stylist'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(0)} className="mt-6 font-body text-sm text-muted hover:text-primary">← Back</button>
          </div>
        )}

        {/* Step 2: date & time */}
        {step === 2 && (
          <div>
            {slotsLoading ? (
              <LoadingSpinner label="Checking availability…" />
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
                  {upcomingDates.map((d) => {
                    const ds = toDateString(d);
                    const hasSlots = (slotsByDate[ds] || []).length > 0;
                    return (
                      <button
                        key={ds}
                        disabled={!hasSlots}
                        onClick={() => { setSelectedDate(ds); setSelectedTime(null); }}
                        className={`shrink-0 font-body text-sm px-4 py-2.5 rounded-sm border transition-colors ${
                          selectedDate === ds
                            ? 'bg-primary text-white border-primary'
                            : hasSlots
                            ? 'border-line text-ink hover:border-primary'
                            : 'border-line text-muted/40 cursor-not-allowed'
                        }`}
                      >
                        {formatDateLabel(ds)}
                      </button>
                    );
                  })}
                </div>

                {currentSlots.length === 0 ? (
                  <Alert type="warning">No open times on this date. Try another day.</Alert>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {currentSlots.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`font-body text-sm px-3 py-2.5 rounded-sm border transition-colors ${
                          selectedTime === t ? 'bg-primary text-white border-primary' : 'border-line text-ink hover:border-primary'
                        }`}
                      >
                        {formatTimeLabel(t)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(1)} className="font-body text-sm text-muted hover:text-primary">← Back</button>
              <button
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
                className="font-body font-semibold bg-primary text-white px-6 py-2.5 rounded-sm hover:bg-primary-dark transition-colors disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: confirm */}
        {step === 3 && (
          <div className="bg-surface border border-line rounded-md p-8">
            <h3 className="font-heading text-xl text-ink mb-5">Review your appointment</h3>
            <dl className="space-y-3 font-body text-sm">
              <div className="flex justify-between"><dt className="text-muted">Service</dt><dd className="text-ink font-medium">{selectedService?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Stylist</dt><dd className="text-ink font-medium">{selectedStylist?.full_name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Date</dt><dd className="text-ink font-medium">{formatDateLabel(selectedDate)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Time</dt><dd className="text-ink font-medium">{formatTimeLabel(selectedTime)}</dd></div>
              <div className="flex justify-between pt-3 border-t border-line"><dt className="text-muted">Total</dt><dd className="text-primary font-heading text-lg">${Number(selectedService?.price).toFixed(2)}</dd></div>
            </dl>

            <div className="mt-5">
              <label className="block font-body text-sm text-ink mb-1.5" htmlFor="notes">Notes for your stylist (optional)</label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Anything we should know before your visit?"
              />
            </div>

            <Alert type="error">{error}</Alert>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="font-body text-sm text-muted hover:text-primary">← Back</button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="font-body font-semibold bg-primary text-white px-7 py-3 rounded-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {submitting ? 'Booking…' : user ? 'Confirm Booking' : 'Sign In to Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
