// Time helpers for working with Postgres `time` (HH:MM:SS) and `date` (YYYY-MM-DD) strings.

export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}:00`;
}

export function formatTimeLabel(t) {
  const mins = timeToMinutes(t);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatDateLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function toDateString(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Generate bookable start-time slots for a single day.
 * @param {object} workingHours { start_time, end_time, is_day_off }
 * @param {Array<{start:number,end:number}>} busyRanges minutes-from-midnight ranges already taken
 * @param {number} durationMinutes length of the service being booked
 * @param {number} stepMinutes granularity between slot start times
 */
export function generateSlots(workingHours, busyRanges, durationMinutes, stepMinutes = 30) {
  if (!workingHours || workingHours.is_day_off) return [];
  const start = timeToMinutes(workingHours.start_time);
  const end = timeToMinutes(workingHours.end_time);
  const slots = [];

  for (let t = start; t + durationMinutes <= end; t += stepMinutes) {
    const slotEnd = t + durationMinutes;
    const overlaps = busyRanges.some((r) => t < r.end && slotEnd > r.start);
    if (!overlaps) slots.push(t);
  }
  return slots.map(minutesToTime);
}
