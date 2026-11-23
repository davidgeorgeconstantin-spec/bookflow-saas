import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../lib/errors.js';
import { sendBookingEmails, type Mailer } from '../lib/email.js';
import type { Store } from '../lib/store.js';
import { canAcceptBooking } from '../shared/plans.js';
import { availableSlots } from '../shared/slots.js';

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const BookingInput = z.object({
  serviceId: z.string().min(1),
  start: z.string().datetime(),
  customer: z.object({ name: z.string().trim().min(2).max(80), email: z.string().email(), phone: z.string().max(30).default('') }),
});

/** Public routes used by the booking page (no login). Only safe, public fields are returned. */
export function publicRouter(store: Store, mailer: Mailer) {
  const r = Router();

  r.get('/businesses/:slug', (req, res) => {
    const b = store.businessBySlug(req.params.slug);
    if (!b) throw new HttpError(404, 'Business not found');
    res.json({ name: b.name, slug: b.slug, type: b.type, timezone: b.timezone, hours: b.hours, services: store.services(b.id) });
  });

  r.get('/businesses/:slug/slots', (req, res) => {
    const b = store.businessBySlug(req.params.slug);
    if (!b) throw new HttpError(404, 'Business not found');
    const q = z.object({ serviceId: z.string(), date: dateKey }).parse(req.query);
    const service = store.services(b.id).find((s) => s.id === q.serviceId);
    if (!service) throw new HttpError(404, 'Service not found');
    res.json(availableSlots({ business: b, service, dateKey: q.date, bookings: store.bookings(b.id) }));
  });

  r.post('/businesses/:slug/bookings', async (req, res) => {
    const b = store.businessBySlug(req.params.slug);
    if (!b) throw new HttpError(404, 'Business not found');
    const input = BookingInput.parse(req.body);
    const service = store.services(b.id).find((s) => s.id === input.serviceId);
    if (!service) throw new HttpError(404, 'Service not found');

    // Never trust the client: re-check that the slot is really free (recomputed on the server).
    const dateKeyOfStart = new Intl.DateTimeFormat('en-CA', { timeZone: b.timezone }).format(new Date(input.start));
    const free = availableSlots({ business: b, service, dateKey: dateKeyOfStart, bookings: store.bookings(b.id) });
    const slot = free.find((s) => s.start === new Date(input.start).toISOString());
    if (!slot) throw new HttpError(409, 'This slot is no longer available');

    const month = slot.start.slice(0, 7);
    const used = store.bookings(b.id).filter((x) => x.status === 'confirmed' && x.start.startsWith(month)).length;
    if (!canAcceptBooking(b.plan, used)) throw new HttpError(402, 'Monthly booking limit reached for this business');

    const booking = store.addBooking({ businessId: b.id, serviceId: service.id, start: slot.start, end: slot.end, customer: input.customer });
    await sendBookingEmails(mailer, booking, b, service);
    res.status(201).json({ id: booking.id, start: booking.start, end: booking.end, status: booking.status });
  });

  return r;
}
