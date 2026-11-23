export type Plan = 'free' | 'pro';
export type Role = 'owner' | 'staff' | 'client';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday (like Date.getDay)

export interface DayHours {
  open: string; // 'HH:mm'
  close: string;
}

/** A tenant. Every other record has a businessId → data of different businesses never mixes. */
export interface Business {
  id: string;
  slug: string;
  name: string;
  type: string;
  timezone: string; // IANA, e.g. 'Europe/Bucharest'
  plan: Plan;
  color: string;
  hours: Record<Weekday, DayHours | null>;
  createdAt: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  durationMin: number;
  price: number; // RON
  color: string;
}

export interface StaffMember {
  id: string;
  businessId: string;
  name: string;
  role: Exclude<Role, 'client'>;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export interface Booking {
  id: string;
  businessId: string;
  serviceId: string;
  start: string; // ISO in UTC
  end: string;
  customer: Customer;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface EmailLog {
  id: string;
  businessId: string;
  to: string;
  subject: string;
  body: string;
  kind: 'confirmation' | 'reminder' | 'cancellation';
  sendAt: string; // ISO; reminders are scheduled 24h before
}

export interface Slot {
  start: string; // ISO UTC
  end: string;
  label: string; // local time in the business timezone
}
