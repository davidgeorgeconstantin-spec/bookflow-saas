'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { PLANS } from '@/lib/plans';
import { cn } from '@/lib/cn';
import type { Plan } from '@/types';

export function PricingCards({ current, onChoose }: { current?: Plan; onChoose?: (p: Plan) => void }) {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full bg-slate-100 p-1">
        {[false, true].map((y) => (
          <button key={String(y)} onClick={() => setYearly(y)} className={cn('relative rounded-full px-5 py-2 text-sm font-semibold', yearly === y ? 'text-white' : 'text-slate-600')}>
            {yearly === y && <motion.span layoutId="billing-period" className="absolute inset-0 rounded-full bg-indigo-600" transition={{ type: 'spring', stiffness: 450, damping: 32 }} />}
            <span className="relative">{y ? 'Yearly · 2 months free' : 'Monthly'}</span>
          </button>
        ))}
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
        {(Object.keys(PLANS) as Plan[]).map((key, i) => {
          const p = PLANS[key];
          const price = yearly ? p.priceYearly : p.priceMonthly;
          const pro = key === 'pro';
          return (
            <motion.article
              key={key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={cn('relative rounded-3xl border p-8', pro ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'border-slate-200 bg-white')}
            >
              {pro && <span className="absolute -top-3 right-6 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900">Recommended</span>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="mt-4 flex items-baseline gap-1">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={price} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }} className="text-5xl font-extrabold tabular-nums">
                    {price}
                  </motion.span>
                </AnimatePresence>
                <span className={pro ? 'text-indigo-200' : 'text-slate-500'}>RON / {yearly ? 'year' : 'month'}</span>
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => <li key={f} className="flex gap-2"><span>✓</span>{f}</li>)}
              </ul>
              {onChoose && (
                <button onClick={() => onChoose(key)} disabled={current === key} className={cn('mt-8 w-full rounded-xl py-3 font-semibold transition disabled:opacity-60', pro ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-slate-900 text-white hover:bg-slate-700')}>
                  {current === key ? 'Current plan' : key === 'pro' ? 'Upgrade (test mode)' : 'Switch to Free'}
                </button>
              )}
            </motion.article>
          );
        })}
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">Demo prices. No real payments: the server example uses Stripe Billing in test mode.</p>
    </div>
  );
}
