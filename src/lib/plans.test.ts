import { describe, expect, it } from 'vitest';
import type { Booking, Business, Service } from '@/types';
import { emailsForBooking } from './emails';
import { canAcceptBooking, canAddService } from './plans';
import { bookingStats } from './stats';

describe('plans', () => {
  it('limits the Free plan and not Pro', () => {
    expect(canAddService('free', 2)).toBe(true);
    expect(canAddService('free', 3)).toBe(false);
    expect(canAddService('pro', 500)).toBe(true);
    expect(canAcceptBooking('free', 30)).toBe(false);
    expect(canAcceptBooking('pro', 10_000)).toBe(true);
  });
});

const business = { id: 'b1', name: 'Studio', timezone: 'Europe/Bucharest', plan: 'pro' } as Business;
const service: Service = { id: 's1', businessId: 'b1', name: 'Cut', durationMin: 60, price: 100, color: '#000' };
const mk = (start: string, status: Booking['status'] = 'confirmed'): Booking => ({ id: start, businessId: 'b1', serviceId: 's1', start, end: start, status, createdAt: '2026-11-20T10:00:00.000Z', customer: { name: 'Ana', email: 'ana@test.ro', phone: '' } });

describe('emails', () => {
  it('sends a confirmation, plus a reminder 24h before on Pro', () => {
    const emails = emailsForBooking(mk('2026-11-25T08:00:00.000Z'), business, service);
    expect(emails.map((e) => e.kind)).toEqual(['confirmation', 'reminder']);
    expect(emails[1]!.sendAt).toBe('2026-11-24T08:00:00.000Z');
    expect(emails[0]!.body).toContain('10:00'); // local time in the email
    expect(emailsForBooking(mk('2026-11-25T08:00:00.000Z'), business, service, 'free')).toHaveLength(1);
  });
});

describe('bookingStats', () => {
  it('counts today, revenue and cancellations in the business time zone', () => {
    const now = new Date('2026-11-23T12:00:00Z');
    const stats = bookingStats([mk('2026-11-23T08:00:00.000Z'), mk('2026-11-20T08:00:00.000Z'), mk('2026-11-21T08:00:00.000Z', 'cancelled'), mk('2026-11-24T08:00:00.000Z')], [service], 'Europe/Bucharest', now);
    expect(stats.today).toHaveLength(1);
    expect(stats.revenue30).toBe(200);
    expect(stats.upcoming).toBe(1);
    expect(stats.cancelRate).toBeCloseTo(1 / 3);
    expect(stats.weeks).toHaveLength(8);
  });
});
