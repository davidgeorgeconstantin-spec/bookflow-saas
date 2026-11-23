'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { emailsForBooking } from '@/lib/emails';
import { createId, slugify } from '@/lib/id';
import { canAcceptBooking, canAddService } from '@/lib/plans';
import type { Booking, Business, Customer, EmailLog, Plan, Role, Service, StaffMember } from '@/types';
import { DEFAULT_HOURS, seedDemo } from './seed';

/**
 * One store = our "database" (localStorage). Every list is filtered by businessId
 * in the selectors below — the same idea as Row Level Security in PostgreSQL.
 */
interface DataState {
  businesses: Business[];
  services: Service[];
  staff: StaffMember[];
  bookings: Booking[];
  emails: EmailLog[];
  session: { businessId: string | null; role: Role };

  loadDemo: () => void;
  createBusiness: (input: { name: string; type: string; timezone: string; ownerName: string }) => Business;
  updateBusiness: (id: string, patch: Partial<Business>) => void;
  setRole: (role: Role) => void;
  logout: () => void;
  addService: (s: Omit<Service, 'id'>) => { ok: boolean; error?: string };
  updateService: (id: string, patch: Partial<Service>) => void;
  deleteService: (id: string) => void;
  book: (input: { businessId: string; serviceId: string; start: string; end: string; customer: Customer }) => { ok: true; booking: Booking } | { ok: false; error: string };
  cancelBooking: (id: string) => void;
  setPlan: (businessId: string, plan: Plan) => void;
}

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      businesses: [],
      services: [],
      staff: [],
      bookings: [],
      emails: [],
      session: { businessId: null, role: 'owner' },

      loadDemo: () => {
        const s = get();
        if (!s.businesses.some((b) => b.id === 'demo-aurora')) {
          const demo = seedDemo();
          // outbox: emails for the most recent demo bookings (so the Emails page is not empty)
          const nowIso = new Date().toISOString();
          const recent = demo.bookings.filter((b) => b.createdAt <= nowIso && b.start > nowIso).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-6);
          const demoEmails = recent
            .flatMap((b) => emailsForBooking(b, demo.business, demo.services.find((x) => x.id === b.serviceId)!))
            .sort((a, b) => b.sendAt.localeCompare(a.sendAt));
          set({ businesses: [...s.businesses, demo.business], services: [...s.services, ...demo.services], staff: [...s.staff, ...demo.staff], bookings: [...s.bookings, ...demo.bookings], emails: [...demoEmails, ...s.emails] });
        }
        set({ session: { businessId: 'demo-aurora', role: 'owner' } });
      },

      createBusiness: ({ name, type, timezone, ownerName }) => {
        const taken = new Set(get().businesses.map((b) => b.slug));
        let slug = slugify(name) || 'my-business';
        for (let i = 2; taken.has(slug); i++) slug = `${slugify(name)}-${i}`;
        const business: Business = { id: createId(), slug, name, type, timezone, plan: 'free', color: '#4f46e5', hours: DEFAULT_HOURS, createdAt: new Date().toISOString() };
        set((s) => ({ businesses: [...s.businesses, business], staff: [...s.staff, { id: createId(), businessId: business.id, name: ownerName, role: 'owner' }], session: { businessId: business.id, role: 'owner' } }));
        return business;
      },

      updateBusiness: (id, patch) => set((s) => ({ businesses: s.businesses.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      setRole: (role) => set((s) => ({ session: { ...s.session, role } })),
      logout: () => set({ session: { businessId: null, role: 'owner' } }),

      addService: (input) => {
        const business = get().businesses.find((b) => b.id === input.businessId);
        const count = get().services.filter((s) => s.businessId === input.businessId).length;
        if (!business || !canAddService(business.plan, count)) return { ok: false, error: 'The Free plan allows up to 3 services. Upgrade to Pro for unlimited services.' };
        set((s) => ({ services: [...s.services, { ...input, id: createId() }] }));
        return { ok: true };
      },
      updateService: (id, patch) => set((s) => ({ services: s.services.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteService: (id) => set((s) => ({ services: s.services.filter((x) => x.id !== id) })),

      book: ({ businessId, serviceId, start, end, customer }) => {
        const s = get();
        const business = s.businesses.find((b) => b.id === businessId);
        const service = s.services.find((x) => x.id === serviceId && x.businessId === businessId);
        if (!business || !service) return { ok: false, error: 'Unknown business or service.' };
        const month = start.slice(0, 7);
        const thisMonth = s.bookings.filter((b) => b.businessId === businessId && b.status === 'confirmed' && b.start.startsWith(month)).length;
        if (!canAcceptBooking(business.plan, thisMonth)) return { ok: false, error: 'This business reached its monthly booking limit.' };
        // double-booking check (the slot list could be stale if two people book at once)
        const clash = s.bookings.some((b) => b.businessId === businessId && b.status === 'confirmed' && Date.parse(b.start) < Date.parse(end) && Date.parse(start) < Date.parse(b.end));
        if (clash) return { ok: false, error: 'Sorry, this slot was just taken. Please pick another one.' };
        const booking: Booking = { id: createId(), businessId, serviceId, start, end, customer, status: 'confirmed', createdAt: new Date().toISOString() };
        set({ bookings: [...s.bookings, booking], emails: [...emailsForBooking(booking, business, service), ...s.emails] });
        return { ok: true, booking };
      },

      cancelBooking: (id) =>
        set((s) => {
          const b = s.bookings.find((x) => x.id === id);
          if (!b) return s;
          const email: EmailLog = { id: createId(), businessId: b.businessId, to: b.customer.email, kind: 'cancellation', sendAt: new Date().toISOString(), subject: 'Your booking was cancelled', body: `Hi ${b.customer.name}, your booking was cancelled. You can book a new time on our page.` };
          return { bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)), emails: [email, ...s.emails.filter((e) => !(e.kind === 'reminder' && e.to === b.customer.email && e.sendAt > new Date().toISOString()))] };
        }),

      setPlan: (businessId, plan) => set((s) => ({ businesses: s.businesses.map((b) => (b.id === businessId ? { ...b, plan } : b)) })),
    }),
    { name: 'bookflow:data', skipHydration: true },
  ),
);

/** Tenant-scoped selectors: components never see another business's records. */
export const useCurrentBusiness = () => useData((s) => s.businesses.find((b) => b.id === s.session.businessId) ?? null);
export function useTenant<T extends { businessId: string }>(pick: (s: DataState) => T[], businessId: string | undefined): T[] {
  const all = useData(pick);
  return businessId ? all.filter((x) => x.businessId === businessId) : [];
}
