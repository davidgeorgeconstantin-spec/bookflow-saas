'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useCurrentBusiness, useData } from '@/features/tenancy/store';
import type { Plan } from '@/types';
import { PricingCards } from './PricingCards';

export function BillingPage() {
  const business = useCurrentBusiness()!;
  const setPlan = useData((s) => s.setPlan);
  const [processing, setProcessing] = useState<Plan | null>(null);
  const [done, setDone] = useState<Plan | null>(null);

  async function choose(plan: Plan) {
    setProcessing(plan);
    await new Promise((r) => setTimeout(r, 1200)); // pretend: Stripe Checkout (test mode) → webhook → plan updated
    setPlan(business.id, plan);
    setProcessing(null);
    setDone(plan);
    setTimeout(() => setDone(null), 2500);
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Plan & billing</h1>
      <p className="mb-8 mt-1 text-slate-500">Current plan: <b className="uppercase text-indigo-600">{business.plan}</b>. Switching is simulated — no card, no payment.</p>
      <PricingCards current={business.plan} onChoose={choose} />
      <AnimatePresence>
        {(processing || done) && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
            {processing ? `Processing test subscription (${processing})…` : `✓ You are now on the ${done === 'pro' ? 'Pro' : 'Free'} plan (test mode)`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
