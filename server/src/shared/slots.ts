// Copied from ../src/lib — the SAME functions run in the browser demo and on the server.
import type { Booking, Business, Service, Slot } from './types.js';
import { formatTimeIn, hhmm, minutesOf, weekdayIn, zonedToUtc } from './time.js';

export const SLOT_STEP_MIN = 15;

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

/**
 * Free time slots for a service on a day (pure function → easy to test, same code runs on the server).
 * 1. take the opening hours for that weekday (in the business time zone)
 * 2. walk in 15-minute steps; a slot must fit before closing
 * 3. drop slots that overlap a confirmed booking or are in the past (+ minimum notice)
 */
export function availableSlots(opts: { business: Business; service: Service; dateKey: string; bookings: Booking[]; now?: Date; minNoticeMin?: number }): Slot[] {
  const { business, service, dateKey, bookings, now = new Date(), minNoticeMin = 60 } = opts;
  const hours = business.hours[weekdayIn(dateKey) as keyof Business['hours']];
  if (!hours) return [];

  const taken = bookings
    .filter((b) => b.businessId === business.id && b.status === 'confirmed')
    .map((b) => [Date.parse(b.start), Date.parse(b.end)] as const);
  const earliest = now.getTime() + minNoticeMin * 60000;

  const slots: Slot[] = [];
  for (let m = minutesOf(hours.open); m + service.durationMin <= minutesOf(hours.close); m += SLOT_STEP_MIN) {
    const start = zonedToUtc(dateKey, hhmm(m), business.timezone);
    const end = new Date(start.getTime() + service.durationMin * 60000);
    if (start.getTime() < earliest) continue;
    if (taken.some(([s, e]) => overlaps(start.getTime(), end.getTime(), s, e))) continue;
    slots.push({ start: start.toISOString(), end: end.toISOString(), label: formatTimeIn(start.toISOString(), business.timezone) });
  }
  return slots;
}
