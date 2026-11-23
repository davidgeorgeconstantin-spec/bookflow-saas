'use client';

import { useRef } from 'react';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';

const STEPS = [
  { n: '01', t: 'Create your business', d: 'Name, type and time zone. You get a public page like /book/?b=your-salon.', icon: '🏪' },
  { n: '02', t: 'Add services & hours', d: 'Duration, price and opening hours per weekday. Free slots are calculated automatically.', icon: '🗓️' },
  { n: '03', t: 'Clients book 24/7', d: 'They pick a service and a free slot. Confirmation and reminder emails are scheduled.', icon: '📩' },
];

/** Pinned section: the steps change while you scroll (ScrollTrigger pin + scrub timeline). */
export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(`${MOTION_OK} and (min-width: 1024px)`, () => {
        const steps = gsap.utils.toArray<HTMLElement>('.step');
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: `+=${steps.length * 500}`, scrub: 0.6, pin: true } });
        steps.forEach((step, i) => {
          if (i === 0) return;
          tl.to(steps[i - 1]!, { opacity: 0, y: -60, scale: 0.95, duration: 1 }).fromTo(step, { opacity: 0, y: 60, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1 }, '<0.2');
        });
        tl.to('.progress-fill', { scaleY: 1, ease: 'none', duration: tl.duration() }, 0);
        gsap.set(steps.slice(1), { opacity: 0 });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="bg-slate-950 text-white lg:h-screen">
      <div className="mx-auto grid h-full max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">How it works</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight">From zero to your first booking in three steps</h2>
          <div className="mt-8 hidden h-40 w-1.5 overflow-hidden rounded-full bg-white/10 lg:block">
            <div className="progress-fill h-full origin-top scale-y-0 bg-gradient-to-b from-indigo-400 to-pink-400" />
          </div>
        </div>
        <div className="relative grid gap-6 lg:block lg:h-72">
          {STEPS.map((s) => (
            <article key={s.n} className="step rounded-3xl border border-white/10 bg-white/5 p-8 lg:absolute lg:inset-0">
              <span className="text-5xl">{s.icon}</span>
              <p className="mt-6 font-mono text-sm text-indigo-300">{s.n}</p>
              <h3 className="mt-1 text-2xl font-bold">{s.t}</h3>
              <p className="mt-2 text-slate-300">{s.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
