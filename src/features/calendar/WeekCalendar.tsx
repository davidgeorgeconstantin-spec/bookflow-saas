'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useCurrentBusiness, useData, useTenant } from '@/features/tenancy/store';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import { addDaysKey, dateKeyIn, formatDayKey, formatTimeIn, minutesOf } from '@/lib/time';
import type { Booking } from '@/types';

const START_H = 8;
const END_H = 20;
const HOUR_PX = 56;

export function WeekCalendar() {
  const business = useCurrentBusiness()!;
  const tz = business.timezone;
  const bookings = useTenant((s) => s.bookings, business.id);
  const services = useTenant((s) => s.services, business.id);
  const cancel = useData((s) => s.cancelBooking);
  const today = dateKeyIn(new Date(), tz);
  const [offset, setOffset] = useState(0); // weeks from the current one
  const [dir, setDir] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const monday = addDaysKey(today, -((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(monday, i));
  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (b.status === 'cancelled' && !showCancelled) continue;
      const k = dateKeyIn(new Date(b.start), tz);
      map.set(k, [...(map.get(k) ?? []), b]);
    }
    return map;
  }, [bookings, tz, showCancelled]);

  const open = bookings.find((b) => b.id === openId) ?? null;
  const go = (n: number) => (setDir(n), setOffset((o) => o + n));
  const now = new Date();
  const nowMin = minutesOf(formatTimeIn(now.toISOString(), tz));

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Calendar</h1>
          <p className="text-slate-500">{formatDayKey(days[0]!, { day: 'numeric', month: 'long' })} – {formatDayKey(days[6]!, { day: 'numeric', month: 'long', year: 'numeric' })} · {tz}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="mr-2 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="accent-indigo-600" /> Show cancelled</label>
          <button onClick={() => go(-1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Previous week">←</button>
          <button onClick={() => (setDir(offset > 0 ? -1 : 1), setOffset(0))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold">Today</button>
          <button onClick={() => go(1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Next week">→</button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-100">
            <span />
            {days.map((d) => (
              <div key={d} className={cn('py-3 text-center text-sm', d === today && 'font-bold text-indigo-600')}>
                {formatDayKey(d, { weekday: 'short' })}
                <span className={cn('mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full', d === today && 'bg-indigo-600 text-white')}>{formatDayKey(d, { day: 'numeric' })}</span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={monday}
              custom={dir}
              variants={{ enter: (d: number) => ({ x: d * 40, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -40, opacity: 0 }) }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22 }}
              className="relative grid grid-cols-[56px_repeat(7,1fr)]"
              style={{ height: (END_H - START_H) * HOUR_PX }}
            >
              <div className="relative">
                {Array.from({ length: END_H - START_H }, (_, i) => (
                  <span key={i} className="absolute right-2 -translate-y-2 text-[11px] text-slate-400" style={{ top: i * HOUR_PX }}>{String(START_H + i).padStart(2, '0')}:00</span>
                ))}
              </div>
              {days.map((d) => {
                const wd = new Date(`${d}T12:00:00Z`).getUTCDay() as keyof typeof business.hours;
                const hours = business.hours[wd];
                return (
                  <div key={d} className="relative border-l border-slate-100">
                    {Array.from({ length: END_H - START_H }, (_, i) => <div key={i} className="border-b border-slate-50" style={{ height: HOUR_PX }} />)}
                    {/* closed hours shaded */}
                    {!hours ? <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#f8fafc_0_8px,#f1f5f9_8px_16px)]" /> : (
                      <>
                        <div className="absolute inset-x-0 top-0 bg-slate-50/80" style={{ height: Math.max(0, (minutesOf(hours.open) - START_H * 60) / 60) * HOUR_PX }} />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-50/80" style={{ top: ((minutesOf(hours.close) - START_H * 60) / 60) * HOUR_PX }} />
                      </>
                    )}
                    {d === today && nowMin > START_H * 60 && nowMin < END_H * 60 && (
                      <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: ((nowMin - START_H * 60) / 60) * HOUR_PX }}>
                        <motion.span className="-ml-1 h-2.5 w-2.5 rounded-full bg-rose-500" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
                        <span className="h-0.5 flex-1 bg-rose-500" />
                      </div>
                    )}
                    {(byDay.get(d) ?? []).map((b, i) => {
                      const s = serviceById.get(b.serviceId);
                      const startMin = minutesOf(formatTimeIn(b.start, tz));
                      const dur = (Date.parse(b.end) - Date.parse(b.start)) / 60000;
                      return (
                        <motion.button
                          key={b.id}
                          layoutId={`booking-${b.id}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03 }}
                          whileHover={{ scale: 1.03, zIndex: 20 }}
                          onClick={() => setOpenId(b.id)}
                          className={cn('absolute inset-x-1 overflow-hidden rounded-lg px-2 py-0.5 text-left text-xs leading-tight text-white shadow-sm', b.status === 'cancelled' && 'opacity-40 line-through')}
                          style={{ top: ((startMin - START_H * 60) / 60) * HOUR_PX + 1, height: (dur / 60) * HOUR_PX - 2, background: s?.color ?? '#64748b' }}
                        >
                          {dur <= 30 ? (
                            <span className="block truncate"><b>{formatTimeIn(b.start, tz)}</b> {b.customer.name}</span>
                          ) : (
                            <>
                              <b className="block truncate">{b.customer.name}</b>
                              <span className="block truncate opacity-90">{formatTimeIn(b.start, tz)} · {s?.name}</span>
                            </>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenId(null)}>
            <motion.div layoutId={`booking-${open.id}`} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="h-2" style={{ background: serviceById.get(open.serviceId)?.color }} />
              <div className="space-y-3 p-6">
                <h2 className="text-xl font-bold">{open.customer.name}</h2>
                <p className="text-slate-600">{serviceById.get(open.serviceId)?.name} · {formatMoney(serviceById.get(open.serviceId)?.price ?? 0)}</p>
                <p className="text-sm text-slate-500">{formatDayKey(dateKeyIn(new Date(open.start), tz), { weekday: 'long', day: 'numeric', month: 'long' })}, {formatTimeIn(open.start, tz)}–{formatTimeIn(open.end, tz)}</p>
                <p className="text-sm text-slate-500">{open.customer.email} · {open.customer.phone}</p>
                <p className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-bold', open.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>{open.status}</p>
                <div className="flex gap-2 pt-2">
                  {open.status === 'confirmed' && <button onClick={() => (cancel(open.id), setOpenId(null))} className="flex-1 rounded-xl bg-rose-50 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100">Cancel booking</button>}
                  <button onClick={() => setOpenId(null)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold">Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
