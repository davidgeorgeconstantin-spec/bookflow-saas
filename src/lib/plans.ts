import type { Plan } from '@/types';

export const PLANS: Record<Plan, { name: string; priceMonthly: number; priceYearly: number; maxServices: number; maxBookingsPerMonth: number; features: string[] }> = {
  free: { name: 'Free', priceMonthly: 0, priceYearly: 0, maxServices: 3, maxBookingsPerMonth: 30, features: ['1 booking page', 'Up to 3 services', '30 bookings / month', 'Email confirmations'] },
  pro: { name: 'Pro', priceMonthly: 49, priceYearly: 470, maxServices: Infinity, maxBookingsPerMonth: Infinity, features: ['Unlimited services', 'Unlimited bookings', 'Email reminders 24h before', 'Statistics dashboard', 'Assistant on your booking page'] },
};

export function canAddService(plan: Plan, current: number) {
  return current < PLANS[plan].maxServices;
}

export function canAcceptBooking(plan: Plan, bookingsThisMonth: number) {
  return bookingsThisMonth < PLANS[plan].maxBookingsPerMonth;
}
