import { randomUUID } from 'node:crypto';
import type { Booking, Business, Plan, Role, Service } from '../shared/types.js';

/**
 * Repository interface. The memory version is for tests and local dev;
 * prisma/schema.prisma shows the same model for PostgreSQL.
 * EVERY tenant query takes a businessId → one business can never read another one's data.
 */
export interface Store {
  businessBySlug(slug: string): Business | undefined;
  businessById(id: string): Business | undefined;
  services(businessId: string): Service[];
  addService(businessId: string, s: Omit<Service, 'id' | 'businessId'>): Service;
  bookings(businessId: string): Booking[];
  addBooking(b: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking;
  cancelBooking(businessId: string, id: string): Booking | undefined;
  setPlan(businessId: string, plan: Plan): void;
  session(token: string): { businessId: string; role: Exclude<Role, 'client'> } | undefined;
}

export function createMemoryStore(seed?: { businesses: Business[]; services: Service[]; bookings?: Booking[]; tokens?: Record<string, { businessId: string; role: 'owner' | 'staff' }> }): Store {
  const businesses = [...(seed?.businesses ?? [])];
  const services = [...(seed?.services ?? [])];
  const bookings = [...(seed?.bookings ?? [])];
  const tokens = { ...(seed?.tokens ?? {}) };

  return {
    businessBySlug: (slug) => businesses.find((b) => b.slug === slug),
    businessById: (id) => businesses.find((b) => b.id === id),
    services: (businessId) => services.filter((s) => s.businessId === businessId),
    addService(businessId, s) {
      const service = { ...s, id: randomUUID(), businessId };
      services.push(service);
      return service;
    },
    bookings: (businessId) => bookings.filter((b) => b.businessId === businessId),
    addBooking(b) {
      const booking: Booking = { ...b, id: randomUUID(), status: 'confirmed', createdAt: new Date().toISOString() };
      bookings.push(booking);
      return booking;
    },
    cancelBooking(businessId, id) {
      const b = bookings.find((x) => x.id === id && x.businessId === businessId);
      if (b) b.status = 'cancelled';
      return b;
    },
    setPlan(businessId, plan) {
      const b = businesses.find((x) => x.id === businessId);
      if (b) b.plan = plan;
    },
    session: (token) => tokens[token],
  };
}
