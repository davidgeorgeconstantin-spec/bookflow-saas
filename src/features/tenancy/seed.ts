import { createId } from '@/lib/id';
import { addDaysKey, dateKeyIn, zonedToUtc } from '@/lib/time';
import type { Booking, Business, Service, StaffMember } from '@/types';

export const DEFAULT_HOURS: Business['hours'] = {
  0: null,
  1: { open: '09:00', close: '18:00' },
  2: { open: '09:00', close: '18:00' },
  3: { open: '09:00', close: '18:00' },
  4: { open: '09:00', close: '19:00' },
  5: { open: '09:00', close: '18:00' },
  6: { open: '10:00', close: '14:00' },
};

const NAMES = ['Ana Pop', 'Mihai Ionescu', 'Ioana Stan', 'Radu Matei', 'Elena Dumitru', 'Vlad Georgescu', 'Maria Florea', 'Andrei Barbu'];

/** Demo tenant "Studio Aurora" with services and ~9 weeks of bookings around today. */
export function seedDemo(now = new Date()) {
  const business: Business = { id: 'demo-aurora', slug: 'studio-aurora', name: 'Studio Aurora', type: 'Hair salon', timezone: 'Europe/Bucharest', plan: 'pro', color: '#4f46e5', hours: DEFAULT_HOURS, createdAt: now.toISOString() };
  const services: Service[] = [
    { id: 's-cut', businessId: business.id, name: 'Haircut', durationMin: 45, price: 120, color: '#6366f1' },
    { id: 's-color', businessId: business.id, name: 'Hair coloring', durationMin: 90, price: 280, color: '#ec4899' },
    { id: 's-beard', businessId: business.id, name: 'Beard trim', durationMin: 30, price: 60, color: '#f59e0b' },
    { id: 's-style', businessId: business.id, name: 'Styling', durationMin: 60, price: 150, color: '#10b981' },
  ];
  const staff: StaffMember[] = [
    { id: 'u-owner', businessId: business.id, name: 'Aurora (owner)', role: 'owner' },
    { id: 'u-staff', businessId: business.id, name: 'Dan (stylist)', role: 'staff' },
  ];

  const bookings: Booking[] = [];
  const today = dateKeyIn(now, business.timezone);
  const times = ['09:00', '10:00', '11:30', '13:00', '14:30', '16:00', '17:00'];
  let k = 0;
  for (let d = -56; d <= 7; d++) {
    let busyUntil = 0; // no overlapping demo bookings
    const day = addDaysKey(today, d);
    const wd = new Date(`${day}T12:00:00Z`).getUTCDay() as keyof Business['hours'];
    if (!business.hours[wd]) continue;
    for (const t of times) {
      if ((k++ * 7 + d * 3) % 5 > 2) continue; // not every slot is booked
      if (wd === 6 && t >= '13:00') continue;
      const service = services[k % services.length]!;
      const start = zonedToUtc(day, t, business.timezone);
      if (start.getTime() < busyUntil) continue;
      busyUntil = start.getTime() + service.durationMin * 60000;
      const name = NAMES[k % NAMES.length]!;
      bookings.push({
        id: createId(),
        businessId: business.id,
        serviceId: service.id,
        start: start.toISOString(),
        end: new Date(start.getTime() + service.durationMin * 60000).toISOString(),
        customer: { name, email: `${name.split(' ')[0]!.toLowerCase()}@example.com`, phone: '07xx xxx xxx' },
        status: k % 17 === 0 ? 'cancelled' : 'confirmed',
        createdAt: new Date(start.getTime() - 3 * 86400000).toISOString(),
      });
    }
  }
  return { business, services, staff, bookings };
}
