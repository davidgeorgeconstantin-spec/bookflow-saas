'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useData } from '@/features/tenancy/store';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import { availableSlots } from '@/lib/slots';
import { addDaysKey, dateKeyIn, formatDayKey } from '@/lib/time';
import type { Booking, Slot } from '@/types';
import { AssistantWidget } from './AssistantWidget';
import { SuccessCheck } from './SuccessCheck';

const DAYS_AHEAD = 14;

export function BookingFlow() {
  const hydrated = useHydrated();
  const slug = useSearchParams().get('b') ?? 'studio-aurora';
  const businesses = useData((s) => s.businesses);
  const allServices = useData((s) => s.services);
  const allBookings = useData((s) => s.bookings);
  const book = useData((s) => s.book);
  const loadDemo = useData((s) => s.loadDemo);
  const business = businesses.find((b) => b.slug === slug) ?? null;

  // First visit to the demo link: create the demo business so the page works for everyone.
  useEffect(() => {
    if (hydrated && !business && slug === 'studio-aurora') loadDemo();
  }, [hydrated, business, slug, loadDemo]);

  const services = useMemo(() => allServices.filter((s) => s.businessId === business?.id), [allServices, business]);
  const bookings = useMemo(() => allBookings.filter((b) => b.businessId === business?.id), [allBookings, business]);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Booking | null>(null);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const today = business ? dateKeyIn(new Date(), business.timezone) : null;
  const days = today ? Array.from({ length: DAYS_AHEAD }, (_, i) => addDaysKey(today, i)) : [];
  const slots = useMemo(
    () => (business && service && dateKey ? availableSlots({ business, service, dateKey, bookings }) : []),
    [business, service, dateKey, bookings],
  );
  const step = !service ? 0 : !slot ? 1 : 2;

  if (!hydrated) return <div className="mx-auto max-w-3xl space-y-4 p-6"><Skeleton className="h-24" /><Skeleton className="h-72" /></div>;
  if (!business)
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div><h1 className="text-2xl font-bold">Business not found</h1><p className="mt-2 text-slate-500">This booking link (<code>{slug}</code>) does not exist in this browser.</p><Link href="/" className="mt-4 inline-block font-semibold text-indigo-600">← BookFlow</Link></div>
      </main>
    );

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!business || !service || !slot) return;
    if (customer.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(customer.email)) return setError('Please enter your name and a valid email.');
    const res = book({ businessId: business.id, serviceId: service.id, start: slot.start, end: slot.end, customer: { ...customer, name: customer.name.trim() } });
    if (!res.ok) {
      setError(res.error);
      setSlot(null);
      return;
    }
    setError(null);
    setDone(res.booking);
  }

  function reset() {
    setDone(null);
    setServiceId(null);
    setDateKey(null);
    setSlot(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-slate-50 pb-24">
      <header className="relative overflow-hidden px-6 pb-16 pt-10 text-center text-white" style={{ background: business.color }}>
        <motion.div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 8 }} />
        <p className="text-sm uppercase tracking-widest text-white/70">{business.type}</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{business.name}</h1>
        <p className="mt-2 text-white/80">Book online in under a minute · times in {business.timezone}</p>
      </header>

      <div className="mx-auto -mt-10 max-w-3xl px-4">
        <div className="relative rounded-3xl bg-white p-6 shadow-xl">
          <ol className="mb-6 flex items-center gap-2 text-xs font-semibold">
            {['Service', 'Date & time', 'Your details'].map((s, i) => (
              <li key={s} className={cn('flex items-center gap-2', i <= step ? 'text-indigo-600' : 'text-slate-400')}>
                <span className={cn('grid h-6 w-6 place-items-center rounded-full', i <= step ? 'bg-indigo-600 text-white' : 'bg-slate-100')}>{i + 1}</span>
                <span className={cn(i !== step && 'hidden sm:inline')}>{s}</span>{i < 2 && <span className="mx-1 text-slate-300">—</span>}
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
                <SuccessCheck />
                <h2 className="mt-4 text-2xl font-bold">You&apos;re booked!</h2>
                <p className="mt-2 text-slate-600">{service?.name} · {formatDayKey(dateKey!, { weekday: 'long', day: 'numeric', month: 'long' })} at {slot?.label}</p>
                <p className="mt-1 text-sm text-slate-500">A confirmation email was added to the outbox for {done.customer.email} (simulated).</p>
                <button onClick={reset} className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Book another</button>
              </motion.div>
            ) : (
              <motion.div key="flow" exit={{ opacity: 0 }} className="space-y-6">
                <section>
                  <h2 className="mb-3 font-semibold">1. Choose a service</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {services.map((s) => (
                      <motion.button key={s.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => (setServiceId(s.id), setSlot(null))} className={cn('relative rounded-2xl border p-4 text-left transition-colors', serviceId === s.id ? 'border-indigo-600' : 'border-slate-200 hover:border-slate-300')}>
                        {serviceId === s.id && <motion.span layoutId="svc-ring" className="absolute inset-0 rounded-2xl ring-2 ring-indigo-600" />}
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /><b>{s.name}</b></span>
                        <span className="mt-1 block text-sm text-slate-500">{s.durationMin} min · {formatMoney(s.price)}</span>
                      </motion.button>
                    ))}
                  </div>
                </section>

                <AnimatePresence>
                  {service && (
                    <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <h2 className="mb-3 font-semibold">2. Pick a day and time</h2>
                      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                        {days.map((d) => {
                          const closed = !business.hours[new Date(`${d}T12:00:00Z`).getUTCDay() as 0]; // weekday of the date key
                          return (
                            <button key={d} disabled={closed} onClick={() => (setDateKey(d), setSlot(null))} className={cn('relative min-w-16 rounded-xl px-3 py-2 text-center text-sm disabled:opacity-35', dateKey === d ? 'text-white' : 'bg-slate-100')}>
                              {dateKey === d && <motion.span layoutId="day-pill" className="absolute inset-0 rounded-xl bg-indigo-600" />}
                              <span className="relative block text-xs">{formatDayKey(d, { weekday: 'short' })}</span>
                              <b className="relative">{formatDayKey(d, { day: 'numeric' })}</b>
                            </button>
                          );
                        })}
                      </div>
                      {dateKey && (
                        <motion.div key={dateKey} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.02 } } }} className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {slots.length === 0 && <p className="col-span-full text-sm text-slate-500">No free slots on this day. Try another one.</p>}
                          {slots.map((s) => (
                            <motion.button key={s.start} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }} onClick={() => setSlot(s)} className={cn('rounded-lg border py-2 text-sm font-medium', slot?.start === s.start ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 hover:border-indigo-300')}>
                              {s.label}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </motion.section>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {slot && (
                    <motion.form onSubmit={confirm} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                      <h2 className="font-semibold">3. Your details</h2>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input required placeholder="Name" aria-label="Name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5" />
                        <input required type="email" placeholder="Email" aria-label="Email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5" />
                        <input placeholder="Phone (optional)" aria-label="Phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5" />
                      </div>
                      <motion.button whileTap={{ scale: 0.98 }} className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-500">
                        Confirm {service?.name} · {formatDayKey(dateKey!, { day: 'numeric', month: 'short' })} {slot.label}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
                {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Demo booking page by BookFlow (learning project). Data stays in your browser.</p>
      </div>
      <AssistantWidget business={business} services={services} />
    </main>
  );
}
