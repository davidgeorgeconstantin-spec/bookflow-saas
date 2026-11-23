import { describe, expect, it } from 'vitest';
import type { Booking, Business, Service } from '@/types';
import { availableSlots } from './slots';

const business: Business = {
  id: 'b1', slug: 'b', name: 'Test', type: 'Salon', timezone: 'Europe/Bucharest', plan: 'free', color: '#000', createdAt: '',
  hours: { 0: null, 1: { open: '09:00', close: '12:00' }, 2: { open: '09:00', close: '12:00' }, 3: null, 4: null, 5: null, 6: null },
};
const service: Service = { id: 's1', businessId: 'b1', name: 'Cut', durationMin: 60, price: 100, color: '#000' };
const past = new Date('2026-01-01T00:00:00Z');
const booking = (start: string, end: string, extra: Partial<Booking> = {}): Booking => ({
  id: start, businessId: 'b1', serviceId: 's1', start, end, status: 'confirmed', createdAt: '', customer: { name: 'A', email: 'a@a.ro', phone: '' }, ...extra,
});

describe('availableSlots', () => {
  it('walks in 15-minute steps and the service must fit before closing', () => {
    const slots = availableSlots({ business, service, dateKey: '2026-11-23', bookings: [], now: past });
    expect(slots.map((s) => s.label)).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00']);
    expect(slots[0]!.start).toBe('2026-11-23T07:00:00.000Z'); // stored in UTC
  });

  it('returns nothing on a closed day', () => {
    expect(availableSlots({ business, service, dateKey: '2026-11-25', bookings: [], now: past })).toEqual([]);
  });

  it('removes slots overlapping a confirmed booking, ignores cancelled ones and other tenants', () => {
    const bookings = [
      booking('2026-11-23T08:00:00.000Z', '2026-11-23T09:00:00.000Z'), // 10:00–11:00 local
      booking('2026-11-23T07:00:00.000Z', '2026-11-23T08:00:00.000Z', { status: 'cancelled' }),
      booking('2026-11-23T09:00:00.000Z', '2026-11-23T10:00:00.000Z', { businessId: 'other' }),
    ];
    const labels = availableSlots({ business, service, dateKey: '2026-11-23', bookings, now: past }).map((s) => s.label);
    expect(labels).toEqual(['09:00', '11:00']);
  });

  it('respects the minimum notice', () => {
    const now = new Date('2026-11-23T07:20:00Z'); // 09:20 local, +60 min notice → first 10:30
    const labels = availableSlots({ business, service, dateKey: '2026-11-23', bookings: [], now }).map((s) => s.label);
    expect(labels[0]).toBe('10:30');
  });
});
