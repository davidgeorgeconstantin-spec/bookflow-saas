import type { Business, Service } from './shared/types.js';

const hours: Business['hours'] = { 0: null, 1: { open: '09:00', close: '18:00' }, 2: { open: '09:00', close: '18:00' }, 3: { open: '09:00', close: '18:00' }, 4: { open: '09:00', close: '19:00' }, 5: { open: '09:00', close: '18:00' }, 6: { open: '10:00', close: '14:00' } };

/** Local dev data. Tokens are fake demo tokens for trying the admin API with curl — not secrets. */
export const devSeed = {
  businesses: [{ id: 'demo-aurora', slug: 'studio-aurora', name: 'Studio Aurora', type: 'Hair salon', timezone: 'Europe/Bucharest', plan: 'pro', color: '#4f46e5', hours, createdAt: new Date().toISOString() }] as Business[],
  services: [
    { id: 's-cut', businessId: 'demo-aurora', name: 'Haircut', durationMin: 45, price: 120, color: '#6366f1' },
    { id: 's-beard', businessId: 'demo-aurora', name: 'Beard trim', durationMin: 30, price: 60, color: '#f59e0b' },
  ] as Service[],
  tokens: { 'dev-owner-token': { businessId: 'demo-aurora', role: 'owner' as const }, 'dev-staff-token': { businessId: 'demo-aurora', role: 'staff' as const } },
};
