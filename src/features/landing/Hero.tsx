'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useData } from '@/features/tenancy/store';
import { gsap, MOTION_OK, SplitText, useGSAP } from '@/lib/gsap';

const CARDS = [
  { t: '09:00', s: 'Haircut', c: 'bg-indigo-500', x: 'left-0 top-6' },
  { t: '11:30', s: 'Coloring', c: 'bg-pink-500', x: 'right-4 top-28' },
  { t: '14:00', s: 'Beard trim', c: 'bg-amber-500', x: 'left-10 bottom-10' },
];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const router = useRouter();
  const loadDemo = useData((s) => s.loadDemo);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const split = SplitText.create('.hero-title', { type: 'words,chars', mask: 'words' });
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.from(split.chars, { yPercent: 110, stagger: 0.018, duration: 0.9 })
          .from('.hero-sub', { y: 24, opacity: 0, stagger: 0.1, duration: 0.7 }, '-=0.5')
          .from('.mock', { y: 60, rotateX: -25, opacity: 0, duration: 1.1, transformPerspective: 900 }, 0.2)
          .from('.mock-card', { scale: 0.5, opacity: 0, stagger: 0.15, duration: 0.6, ease: 'back.out(2)' }, '-=0.5');
        gsap.to('.mock-card', { y: -12, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.6 });
        // parallax while scrolling away
        gsap.to('.mock', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } });
        return () => split.revert();
      });
    },
    { scope: root },
  );

  async function demo() {
    if (!useData.persist.hasHydrated()) await useData.persist.rehydrate(); // never overwrite saved data
    loadDemo();
    router.push('/app/');
  }

  return (
    <section ref={root} className="relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_60%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-16 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div>
          <p className="hero-sub inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-sm font-medium text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Learning project · final SaaS
          </p>
          <h1 className="hero-title mt-6 text-5xl font-extrabold leading-[1.04] tracking-tight text-slate-900 sm:text-6xl">Online bookings for small businesses</h1>
          <p className="hero-sub mt-6 max-w-lg text-lg text-slate-600">
            Salons, clinics and studios get a public booking page, a calendar, automatic email reminders and simple statistics — in one multi-tenant app.
          </p>
          <div className="hero-sub mt-9 flex flex-wrap gap-3">
            <button onClick={demo} className="rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-500">Open the demo business →</button>
            <Link href="/signup/" className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-800 transition hover:-translate-y-0.5">Create your own</Link>
          </div>
          <p className="hero-sub mt-4 text-sm text-slate-500">Runs in your browser · no sign-up, no card · data stays in localStorage</p>
        </div>

        <div className="relative h-[380px] [perspective:900px]">
          <div className="mock absolute inset-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-indigo-900/10">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold text-slate-900">Tuesday</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">6 bookings</span>
            </div>
            <div className="space-y-2">
              {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map((h) => (
                <div key={h} className="flex items-center gap-3 text-xs text-slate-400"><span className="w-10">{h}</span><span className="h-px flex-1 bg-slate-100" /></div>
              ))}
            </div>
          </div>
          {CARDS.map((c) => (
            <div key={c.t} className={`mock-card absolute ${c.x} flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-100`}>
              <span className={`h-9 w-1.5 rounded-full ${c.c}`} />
              <span>
                <span className="block text-sm font-bold text-slate-900">{c.s}</span>
                <span className="text-xs text-slate-500">{c.t} · confirmed ✓</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
