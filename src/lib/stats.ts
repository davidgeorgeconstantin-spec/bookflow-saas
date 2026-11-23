import type { Booking, Service } from '@/types';
import { addDaysKey, dateKeyIn } from './time';

/** Dashboard numbers (same aggregations as project 8, now per tenant). */
export function bookingStats(bookings: Booking[], services: Service[], timeZone: string, now = new Date()) {
  const today = dateKeyIn(now, timeZone);
  const price = new Map(services.map((s) => [s.id, s.price]));
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const dayOf = (b: Booking) => dateKeyIn(new Date(b.start), timeZone);
  const last30 = addDaysKey(today, -29);
  const past30 = confirmed.filter((b) => dayOf(b) >= last30 && dayOf(b) <= today);

  // last 8 weeks (Monday-based), oldest first
  const mondayOffset = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const thisMonday = addDaysKey(today, -mondayOffset);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const from = addDaysKey(thisMonday, (i - 7) * 7);
    const to = addDaysKey(from, 6);
    const list = confirmed.filter((b) => dayOf(b) >= from && dayOf(b) <= to);
    return { from, count: list.length, revenue: list.reduce((s, b) => s + (price.get(b.serviceId) ?? 0), 0) };
  });

  const popular = services
    .map((s) => ({ service: s, count: past30.filter((b) => b.serviceId === s.id).length }))
    .sort((a, b) => b.count - a.count);

  const inLast30 = bookings.filter((b) => dayOf(b) >= last30 && dayOf(b) <= today);
  return {
    today: confirmed.filter((b) => dayOf(b) === today).sort((a, b) => a.start.localeCompare(b.start)),
    thisWeek: weeks.at(-1)!.count,
    revenue30: past30.reduce((s, b) => s + (price.get(b.serviceId) ?? 0), 0),
    upcoming: confirmed.filter((b) => Date.parse(b.start) > now.getTime()).length,
    cancelRate: inLast30.length ? inLast30.filter((b) => b.status === 'cancelled').length / inLast30.length : 0,
    weeks,
    popular,
  };
}
