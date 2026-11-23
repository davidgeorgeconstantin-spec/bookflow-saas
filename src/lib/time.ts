/**
 * Time zones without a library. Rule: store everything in UTC (ISO strings),
 * convert to the BUSINESS time zone only for calculations and display.
 */

/** Offset (minutes) of `timeZone` from UTC at a given instant. */
export function tzOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** "2026-11-24" + "09:30" in Europe/Bucharest → the exact UTC instant. Handles DST. */
export function zonedToUtc(dateKey: string, time: string, timeZone: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number) as [number, number, number];
  const [hh, mm] = time.split(':').map(Number) as [number, number];
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const offset = tzOffsetMinutes(guess, timeZone);
  const result = new Date(guess.getTime() - offset * 60000);
  // second pass in case the offset changed (DST switch day)
  const offset2 = tzOffsetMinutes(result, timeZone);
  return offset2 === offset ? result : new Date(guess.getTime() - offset2 * 60000);
}

/** Calendar date (YYYY-MM-DD) of an instant in a time zone. */
export function dateKeyIn(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function weekdayIn(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

export function addDaysKey(dateKey: string, n: number): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const formatTimeIn = (iso: string, timeZone: string) => new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
export const formatDateIn = (iso: string, timeZone: string) => new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso));
export const formatDayKey = (dateKey: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(new Date(`${dateKey}T12:00:00Z`));

export const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return h * 60 + m;
};
export const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
