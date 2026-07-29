import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const TYPE_ICONS = {
  booking: '📅',
  reminder: '⏰',
  promotion: '🎁',
  system: '⚙️',
  review: '⭐',
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Updates</p>
          <h1 className="font-heading text-4xl text-ink">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="font-body text-sm text-primary font-semibold hover:text-primary-dark">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications yet" description="Booking updates and reminders will show up here." />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`text-left flex gap-4 items-start p-5 rounded-md border transition-colors ${
                n.is_read ? 'bg-surface border-line' : 'bg-accent/40 border-primary/20'
              }`}
            >
              <span className="text-xl leading-none mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-base text-ink">{n.title}</h3>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="font-body text-sm text-muted mt-0.5">{n.body}</p>
                <p className="font-body text-xs text-muted/70 mt-1.5">
                  {new Date(n.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
