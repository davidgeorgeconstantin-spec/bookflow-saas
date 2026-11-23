import type { Booking, Business, EmailLog, Service } from '@/types';
import { createId } from './id';
import { formatDateIn, formatTimeIn } from './time';

/**
 * Builds the emails for a booking. The demo only stores them in an "outbox";
 * the server example (server/src/email.ts) sends them with Resend (free plan).
 */
export function emailsForBooking(b: Booking, business: Business, service: Service, plan = business.plan): EmailLog[] {
  const when = `${formatDateIn(b.start, business.timezone)} at ${formatTimeIn(b.start, business.timezone)}`;
  const base = { businessId: business.id, to: b.customer.email };
  const out: EmailLog[] = [
    { ...base, id: createId(), kind: 'confirmation', sendAt: b.createdAt, subject: `Booking confirmed: ${service.name} · ${business.name}`, body: `Hi ${b.customer.name}, your ${service.name} (${service.durationMin} min) is booked for ${when} (${business.timezone}). See you soon!` },
  ];
  if (plan === 'pro') {
    const sendAt = new Date(Date.parse(b.start) - 24 * 3600_000).toISOString();
    out.push({ ...base, id: createId(), kind: 'reminder', sendAt, subject: `Reminder: ${service.name} tomorrow`, body: `Hi ${b.customer.name}, a reminder that your ${service.name} at ${business.name} is ${when}.` });
  }
  return out;
}
