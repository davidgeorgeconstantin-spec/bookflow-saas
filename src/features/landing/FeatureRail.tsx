'use client';

import { useRef } from 'react';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';

const FEATURES = [
  { t: 'Multi-tenant', d: 'Many businesses in one app. Every record has a businessId and every query filters by it.', c: 'from-indigo-500 to-violet-500' },
  { t: 'Roles', d: 'Owner, staff and client views. Staff see the calendar; only owners manage billing.', c: 'from-pink-500 to-rose-500' },
  { t: 'Time zones', d: 'Times are stored in UTC and shown in the business time zone — DST included.', c: 'from-amber-500 to-orange-500' },
  { t: 'Email reminders', d: 'Confirmation now, reminder 24h before (Pro). The server sends them with Resend.', c: 'from-emerald-500 to-teal-500' },
  { t: 'Statistics', d: 'Bookings, revenue and popular services for the last weeks.', c: 'from-sky-500 to-cyan-500' },
  { t: 'Assistant', d: 'Answers clients about services, prices and hours — only from your data (demo, rule-based).', c: 'from-fuchsia-500 to-purple-500' },
];

/** Horizontal scroll: vertical scrolling moves the cards sideways (pinned section). */
export function FeatureRail() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(`${MOTION_OK} and (min-width: 768px)`, () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth + 80;
        gsap.to(el, { x: () => -distance(), ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: 0.8, pin: true, invalidateOnRefresh: true } });
        gsap.from('.rail-card', { opacity: 0, y: 40, stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 70%' } });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="overflow-hidden py-20 md:flex md:h-screen md:flex-col md:justify-center">
      <div className="mx-auto w-full max-w-6xl px-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Features</p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">Everything a small business needs</h2>
      </div>
      <div ref={track} className="mt-10 flex gap-6 overflow-x-auto px-5 pb-4 md:w-max md:overflow-visible md:pl-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]">
        {FEATURES.map((f) => (
          <article key={f.t} className="rail-card w-80 shrink-0 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${f.c}`} />
            <h3 className="mt-6 text-xl font-bold text-slate-900">{f.t}</h3>
            <p className="mt-2 text-slate-600">{f.d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
