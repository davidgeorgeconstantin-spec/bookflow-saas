'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useData } from '@/features/tenancy/store';
import { cn } from '@/lib/cn';

const TYPES = ['Hair salon', 'Barber shop', 'Beauty studio', 'Massage', 'Dentist', 'Personal trainer', 'Tutor', 'Other'];
const ZONES = ['Europe/Bucharest', 'Europe/London', 'Europe/Berlin', 'Europe/Madrid', 'America/New_York', 'Asia/Tokyo'];

export function SignupWizard() {
  const router = useRouter();
  const createBusiness = useData((s) => s.createBusiness);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState({ name: '', type: TYPES[0]!, timezone: 'Europe/Bucharest', ownerName: '' });
  const [error, setError] = useState<string | null>(null);

  const steps = ['Business', 'Location & time', 'You'];
  const valid = [form.name.trim().length >= 2, !!form.timezone, form.ownerName.trim().length >= 2];

  function next() {
    if (!valid[step]) return setError(step === 0 ? 'Enter your business name (min. 2 characters).' : 'Enter your name.');
    setError(null);
    if (step < steps.length - 1) return (setDir(1), setStep(step + 1));
    createBusiness({ ...form, name: form.name.trim(), ownerName: form.ownerName.trim() });
    router.push('/app/');
  }
  const back = () => (setDir(-1), setStep(step - 1), setError(null));

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-xl font-extrabold">Book<span className="text-indigo-600">Flow</span></Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
          <ol className="mb-6 flex gap-2">
            {steps.map((s, i) => (
              <li key={s} className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div className="h-full bg-indigo-600" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
                </div>
                <span className={cn('mt-1 block text-xs', i === step ? 'font-semibold text-indigo-600' : 'text-slate-400')}>{s}</span>
              </li>
            ))}
          </ol>
          <form onSubmit={(e) => (e.preventDefault(), next())} className="relative min-h-[320px] overflow-hidden pb-16">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                custom={dir}
                variants={{ enter: (d: number) => ({ x: d * 60, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -60, opacity: 0 }) }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {step === 0 && (
                  <>
                    <h1 className="text-2xl font-bold">Create your booking page</h1>
                    <label className="block text-sm font-medium">Business name<input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Studio Luna" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                    <div className="flex flex-wrap gap-2">
                      {TYPES.map((t) => (
                        <button type="button" key={t} onClick={() => setForm({ ...form, type: t })} className={cn('relative rounded-full px-3 py-1.5 text-sm', form.type === t ? 'text-white' : 'bg-slate-100 text-slate-600')}>
                          {form.type === t && <motion.span layoutId="type-pill" className="absolute inset-0 rounded-full bg-indigo-600" />}
                          <span className="relative">{t}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <h1 className="text-2xl font-bold">Where are you?</h1>
                    <p className="text-sm text-slate-500">Slots are calculated in this time zone; clients see local times.</p>
                    <label className="block text-sm font-medium">Time zone
                      <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">{ZONES.map((z) => <option key={z}>{z}</option>)}</select>
                    </label>
                    <p className="text-xs text-slate-500">Default hours: Mon–Fri 09:00–18:00, Sat 10:00–14:00. You can change them later.</p>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h1 className="text-2xl font-bold">Last step</h1>
                    <label className="block text-sm font-medium">Your name<input autoFocus value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} placeholder="e.g. Ana Pop" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                    <p className="text-xs text-slate-500">Demo: no password — data stays in this browser (localStorage). The real backend uses accounts + PostgreSQL.</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            {error && <p className="mt-3 text-sm text-rose-600" role="alert">{error}</p>}
            <div className="absolute inset-x-0 bottom-0 flex gap-2">
              {step > 0 && <button type="button" onClick={back} className="rounded-xl bg-slate-100 px-4 py-3 font-semibold">Back</button>}
              <motion.button whileTap={{ scale: 0.97 }} className="flex-1 rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-500">{step === steps.length - 1 ? 'Create business' : 'Continue'}</motion.button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
