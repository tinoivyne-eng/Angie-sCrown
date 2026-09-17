import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import { formatDateLabel, formatTimeLabel } from '../lib/time';

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*, services(name, price), stylists(full_name)')
      .eq('customer_id', user.id)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setAppointments(data || []);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('appointment_id')
        .eq('customer_id', user.id);
      setReviewedIds(new Set((reviews || []).map((r) => r.appointment_id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCancel = async (appt) => {
    if (!window.confirm('Cancel this appointment?')) return;
    const { error } = await supabase
      .rpc('cancel_own_appointment', { p_appointment_id: appt.id });
    if (error) {
      setError(error.message);
      return;
    }
    load();
  };

  const submitReview = async () => {
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      appointment_id: reviewTarget.id,
      customer_id: user.id,
      stylist_id: reviewTarget.stylist_id,
      service_id: reviewTarget.service_id,
      rating,
      comment: comment || null,
    });
    setSubmittingReview(false);
    if (error) {
      setError(error.message);
      return;
    }
    setReviewTarget(null);
    setRating(5);
    setComment('');
    load();
  };

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(`${a.appointment_date}T${a.start_time}`) >= now && a.status !== 'cancelled');
  const past = appointments.filter((a) => new Date(`${a.appointment_date}T${a.start_time}`) < now || a.status === 'cancelled');

  const AppointmentRow = ({ appt, canCancel, canReview }) => (
    <div className="bg-surface border border-line rounded-md p-5 flex flex-wrap items-center gap-4 justify-between">
      <div>
        <h3 className="font-heading text-lg text-ink">{appt.services?.name}</h3>
        <p className="font-body text-sm text-muted">
          with {appt.stylists?.full_name} · {formatDateLabel(appt.appointment_date)} at {formatTimeLabel(appt.start_time)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-heading text-primary">${Number(appt.total_price).toFixed(0)}</span>
        <StatusBadge status={appt.status} />
        {canCancel && (
          <button onClick={() => handleCancel(appt)} className="font-body text-sm text-danger hover:underline">
            Cancel
          </button>
        )}
        {canReview && !reviewedIds.has(appt.id) && (
          <button onClick={() => setReviewTarget(appt)} className="font-body text-sm text-primary hover:underline">
            Leave a review
          </button>
        )}
        {canReview && reviewedIds.has(appt.id) && (
          <span className="font-body text-xs text-muted">Reviewed</span>
        )}
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Your visits</p>
          <h1 className="font-heading text-4xl text-ink">My Appointments</h1>
        </div>
        <Link to="/booking" className="font-body font-semibold bg-primary text-white px-5 py-2.5 rounded-sm hover:bg-primary-dark transition-colors">
          Book New
        </Link>
      </div>

      <Alert type="error">{error}</Alert>

      <section className="mb-12">
        <h2 className="font-heading text-xl text-ink mb-4">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming appointments" description="When you book, it'll show up here." />
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((a) => <AppointmentRow key={a.id} appt={a} canCancel />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-heading text-xl text-ink mb-4">Past</h2>
        {past.length === 0 ? (
          <EmptyState title="No past appointments yet" />
        ) : (
          <div className="flex flex-col gap-3">
            {past.map((a) => <AppointmentRow key={a.id} appt={a} canReview={a.status === 'completed'} />)}
          </div>
        )}
      </section>

      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-secondary/60 flex items-center justify-center p-6" onClick={() => setReviewTarget(null)}>
          <div className="bg-surface rounded-md p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-xl text-ink mb-4">Rate your visit</h3>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`h-10 w-10 rounded-full border font-body text-sm ${
                    n <= rating ? 'bg-primary text-white border-primary' : 'border-line text-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was it? (optional)"
              className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setReviewTarget(null)} className="font-body text-sm text-muted">Cancel</button>
              <button
                onClick={submitReview}
                disabled={submittingReview}
                className="font-body font-semibold bg-primary text-white px-5 py-2 rounded-sm hover:bg-primary-dark disabled:opacity-60"
              >
                {submittingReview ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
