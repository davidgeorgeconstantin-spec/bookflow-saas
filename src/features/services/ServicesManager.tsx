'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useCurrentBusiness, useData, useTenant } from '@/features/tenancy/store';
import { formatMoney } from '@/lib/money';
import { PLANS } from '@/lib/plans';
import type { Business, Weekday } from '@/types';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6'];
const DAYS: { d: Weekday; label: string }[] = [
  { d: 1, label: 'Monday' }, { d: 2, label: 'Tuesday' }, { d: 3, label: 'Wednesday' }, { d: 4, label: 'Thursday' }, { d: 5, label: 'Friday' }, { d: 6, label: 'Saturday' }, { d: 0, label: 'Sunday' },
];

export function ServicesManager() {
  const business = useCurrentBusiness()!;
  const services = useTenant((s) => s.services, business.id);
  const addService = useData((s) => s.addService);
  const deleteService = useData((s) => s.deleteService);
  const updateBusiness = useData((s) => s.updateBusiness);
  const [form, setForm] = useState({ name: '', durationMin: 45, price: 100 });
  const [error, setError] = useState<string | null>(null);
  const limit = PLANS[business.plan].maxServices;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError('Enter a service name.');
    const res = addService({ businessId: business.id, name: form.name.trim(), durationMin: form.durationMin, price: form.price, color: COLORS[services.length % COLORS.length]! });
    if (!res.ok) return setError(res.error ?? 'Could not add the service.');
    setError(null);
    setForm({ name: '', durationMin: 45, price: 100 });
  }

  function setDay(d: Weekday, value: Business['hours'][Weekday]) {
    updateBusiness(business.id, { hours: { ...business.hours, [d]: value } });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Services & hours</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Services" action={<span className="text-xs text-slate-500">{services.length} / {Number.isFinite(limit) ? limit : '∞'} on {PLANS[business.plan].name}</span>}>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {services.map((s) => (
                <motion.li key={s.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, x: 40 }} className="overflow-hidden">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                    <span className="h-9 w-1.5 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1"><b className="block text-sm">{s.name}</b><span className="text-xs text-slate-500">{s.durationMin} min</span></span>
                    <span className="text-sm font-semibold">{formatMoney(s.price)}</span>
                    <button onClick={() => deleteService(s.id)} className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${s.name}`}>Delete</button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <form onSubmit={submit} className="mt-4 grid grid-cols-[1fr_90px_100px] gap-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="New service" aria-label="Service name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <select value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} aria-label="Duration" className="rounded-xl border border-slate-200 px-2 py-2 text-sm">
              {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
            <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} aria-label="Price" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <button className="col-span-3 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">+ Add service</button>
          </form>
          <AnimatePresence>{error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-sm text-rose-600">{error}</motion.p>}</AnimatePresence>
        </Card>

        <Card title={`Opening hours · ${business.timezone}`}>
          <ul className="space-y-2">
            {DAYS.map(({ d, label }) => {
              const h = business.hours[d];
              return (
                <li key={d} className="flex items-center gap-3 text-sm">
                  <button
                    role="switch"
                    aria-checked={!!h}
                    aria-label={`${label} open`}
                    onClick={() => setDay(d, h ? null : { open: '09:00', close: '17:00' })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${h ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 35 }} className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${h ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                  <span className="w-24 font-medium">{label}</span>
                  {h ? (
                    <span className="flex items-center gap-2">
                      <input type="time" value={h.open} step={900} onChange={(e) => setDay(d, { ...h, open: e.target.value })} className="rounded-lg border border-slate-200 px-2 py-1" aria-label={`${label} opens`} />
                      –
                      <input type="time" value={h.close} step={900} onChange={(e) => setDay(d, { ...h, close: e.target.value })} className="rounded-lg border border-slate-200 px-2 py-1" aria-label={`${label} closes`} />
                    </span>
                  ) : (
                    <span className="text-slate-400">Closed</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
