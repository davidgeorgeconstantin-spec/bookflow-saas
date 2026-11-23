'use client';

import { motion } from 'motion/react';
import { useMemo } from 'react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Card } from '@/components/ui/Card';
import { useCurrentBusiness, useData, useTenant } from '@/features/tenancy/store';
import { formatMoney } from '@/lib/money';
import { bookingStats } from '@/lib/stats';
import { formatDayKey, formatTimeIn } from '@/lib/time';

const pct = (n: number) => `${Math.round(n * 100)}%`;
const int = (n: number) => Math.round(n).toString();

export function Dashboard() {
  const business = useCurrentBusiness()!;
  const bookings = useTenant((s) => s.bookings, business.id);
  const services = useTenant((s) => s.services, business.id);
  const role = useData((s) => s.session.role);
  const stats = useMemo(() => bookingStats(bookings, services, business.timezone), [bookings, services, business.timezone]);
  const maxWeek = Math.max(...stats.weeks.map((w) => w.count), 1);
  const maxPop = Math.max(...stats.popular.map((p) => p.count), 1);
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const kpis = [
    { label: 'Bookings this week', value: stats.thisWeek, fmt: int },
    { label: 'Revenue · last 30 days', value: stats.revenue30, fmt: formatMoney, ownerOnly: true },
    { label: 'Upcoming bookings', value: stats.upcoming, fmt: int },
    { label: 'Cancellation rate', value: stats.cancelRate, fmt: pct },
  ].filter((k) => !k.ownerOnly || role === 'owner');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Good to see you 👋</h1>
        <p className="mt-1 text-slate-500">{business.name} · times shown in {business.timezone}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{k.label}</p>
            <p className="mt-1 text-3xl font-extrabold"><AnimatedNumber value={k.value} format={k.fmt} /></p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Bookings per week">
          <div className="flex h-56 items-end gap-3">
            {stats.weeks.map((w, i) => (
              <div key={w.from} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-slate-500">{w.count}</span>
                <motion.div
                  className="w-full origin-bottom rounded-t-xl bg-gradient-to-t from-indigo-600 to-violet-400"
                  style={{ height: Math.max(4, (w.count / maxWeek) * 170) }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 120, damping: 16 }}
                  title={role === 'owner' ? formatMoney(w.revenue) : undefined}
                />
                <span className="text-[11px] text-slate-400">{formatDayKey(w.from, { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Popular services · 30 days">
          <ul className="space-y-4">
            {stats.popular.map((p, i) => (
              <li key={p.service.id}>
                <div className="flex justify-between text-sm"><span className="font-medium">{p.service.name}</span><span className="text-slate-500">{p.count}</span></div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div className="h-full origin-left rounded-full" style={{ background: p.service.color }} initial={{ scaleX: 0 }} animate={{ scaleX: p.count / maxPop }} transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 90, damping: 18 }} />
                </div>
              </li>
            ))}
            {stats.popular.length === 0 && <p className="text-sm text-slate-500">Add services to see statistics.</p>}
          </ul>
        </Card>
      </div>

      <Card title="Today's agenda">
        {stats.today.length === 0 ? (
          <p className="py-6 text-center text-slate-500">No bookings today.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {stats.today.map((b, i) => {
              const s = serviceById.get(b.serviceId);
              return (
                <motion.li key={b.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="flex items-center gap-4 py-3">
                  <span className="w-14 font-mono text-sm font-semibold">{formatTimeIn(b.start, business.timezone)}</span>
                  <span className="h-8 w-1.5 rounded-full" style={{ background: s?.color }} />
                  <span className="flex-1"><b className="block text-sm">{b.customer.name}</b><span className="text-sm text-slate-500">{s?.name} · {s?.durationMin} min</span></span>
                  {role === 'owner' && <span className="text-sm font-semibold">{s ? formatMoney(s.price) : ''}</span>}
                </motion.li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
