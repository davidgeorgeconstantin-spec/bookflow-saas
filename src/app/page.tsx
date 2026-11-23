import Link from 'next/link';
import { PricingCards } from '@/features/billing/PricingCards';
import { FeatureRail } from '@/features/landing/FeatureRail';
import { Hero } from '@/features/landing/Hero';
import { HowItWorks } from '@/features/landing/HowItWorks';

export default function LandingPage() {
  return (
    <main className="bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-slate-900"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">B</span>BookFlow</Link>
          <nav className="flex items-center gap-5 text-sm font-semibold text-slate-600">
            <a href="#pricing" className="hidden hover:text-slate-900 sm:inline">Pricing</a>
            <Link href="/book/?b=studio-aurora" className="hidden hover:text-slate-900 sm:inline">Booking page demo</Link>
            <Link href="/signup/" className="rounded-lg bg-slate-900 px-4 py-2 text-white">Get started</Link>
          </nav>
        </div>
      </header>
      <Hero />
      <HowItWorks />
      <FeatureRail />
      <section id="pricing" className="px-5 py-24">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-slate-900">Simple pricing</h2>
        <p className="mb-10 mt-3 text-center text-slate-600">Start free. Upgrade when you need reminders and unlimited bookings.</p>
        <PricingCards />
      </section>
      <footer className="border-t border-slate-200 py-10 text-center text-sm text-slate-500">
        BookFlow — final learning project by David Constantin · Next.js, TypeScript, GSAP, Motion, Zustand ·{' '}
        <a className="underline" href="https://github.com/davidgeorgeconstantin-spec/bookflow-saas">Source</a>
      </footer>
    </main>
  );
}
