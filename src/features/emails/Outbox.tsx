'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useCurrentBusiness, useTenant } from '@/features/tenancy/store';
import { cn } from '@/lib/cn';
import { formatDateIn, formatTimeIn } from '@/lib/time';

const KIND: Record<string, string> = { confirmation: 'bg-emerald-100 text-emerald-700', reminder: 'bg-indigo-100 text-indigo-700', cancellation: 'bg-rose-100 text-rose-700' };

/** The demo does not send emails: it shows what the server would send (and when). */
export function Outbox() {
  const business = useCurrentBusiness()!;
  const emails = useTenant((s) => s.emails, business.id);
  const [openId, setOpenId] = useState<string | null>(null);
  const now = new Date().toISOString();

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Emails</h1>
      <p className="mb-6 mt-1 text-slate-500">Outbox (simulated). In production, <code>/server</code> sends these with Resend; reminders go out 24h before the booking (Pro plan).</p>
      {emails.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No emails yet. Make a booking on your public page.</p>}
      <ul className="space-y-2">
        {emails.map((e, i) => (
          <motion.li key={e.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <button onClick={() => setOpenId(openId === e.id ? null : e.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left">
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold capitalize', KIND[e.kind])}>{e.kind}</span>
              <span className="flex-1 truncate text-sm font-medium">{e.subject}</span>
              <span className="hidden text-xs text-slate-500 sm:inline">{e.to}</span>
              <span className="text-xs text-slate-500">{e.sendAt > now ? '⏰ ' : '✓ '}{formatDateIn(e.sendAt, business.timezone)} {formatTimeIn(e.sendAt, business.timezone)}</span>
            </button>
            <AnimatePresence initial={false}>
              {openId === e.id && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 bg-slate-50 px-5 text-sm text-slate-700">
                  <span className="block py-4">{e.body}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
