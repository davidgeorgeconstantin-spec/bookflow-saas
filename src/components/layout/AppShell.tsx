'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { PERMISSIONS, RoleSwitcher } from '@/features/tenancy/RoleSwitcher';
import { useCurrentBusiness, useData } from '@/features/tenancy/store';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/app/', label: 'Dashboard', icon: '📊' },
  { href: '/app/calendar/', label: 'Calendar', icon: '🗓️' },
  { href: '/app/services/', label: 'Services & hours', icon: '✂️' },
  { href: '/app/emails/', label: 'Emails', icon: '📩' },
  { href: '/app/billing/', label: 'Plan & billing', icon: '💳' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const business = useCurrentBusiness();
  const role = useData((s) => s.session.role);
  const logout = useData((s) => s.logout);
  const pathname = usePathname();
  const router = useRouter();
  const path = pathname.replace(/\/$/, '') || '/app';
  const allowed = PERMISSIONS[path]?.includes(role) ?? true;

  useEffect(() => {
    if (hydrated && !business) router.replace('/signup/');
  }, [hydrated, business, router]);

  if (!hydrated || !business)
    return (
      <div className="flex min-h-screen gap-6 p-6">
        <Skeleton className="hidden w-60 md:block" />
        <div className="flex-1 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-32" /><Skeleton className="h-80" /></div>
      </div>
    );

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="border-b border-slate-200 bg-white md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2 px-5 py-4 md:block md:py-6">
          <Link href="/" className="flex items-center gap-2 font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">B</span>BookFlow</Link>
          <div className="md:mt-6">
            <p className="truncate text-sm font-semibold">{business.name}</p>
            <p className="text-xs text-slate-500">{business.type} · <span className="font-semibold uppercase text-indigo-600">{business.plan}</span></p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {NAV.map((n) => {
            const active = path === n.href.replace(/\/$/, '');
            const can = PERMISSIONS[n.href.replace(/\/$/, '')]?.includes(role) ?? true;
            return (
              <Link key={n.href} href={n.href} className={cn('relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium', active ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-900', !can && 'opacity-40')}>
                {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-indigo-50" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <span className="relative">{n.icon}</span>
                <span className="relative">{n.label}</span>
                {!can && <span className="relative ml-auto text-xs">🔒</span>}
              </Link>
            );
          })}
          <Link href={`/book/?b=${business.slug}`} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">🌐 <span>Public booking page ↗</span></Link>
        </nav>
        <div className="hidden space-y-4 px-4 md:absolute md:inset-x-0 md:bottom-5 md:block">
          <RoleSwitcher />
          <button onClick={() => (logout(), router.push('/'))} className="w-full rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50">Log out</button>
        </div>
      </aside>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-4 md:hidden"><RoleSwitcher /></div>
        <AnimatePresence mode="wait">
          <motion.div key={pathname + (allowed ? '' : '-denied')} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {allowed ? children : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <p className="text-5xl">🔒</p>
                <h1 className="mt-4 text-xl font-bold">Not allowed for the “{role}” role</h1>
                <p className="mt-2 text-slate-500">{role === 'client' ? 'Clients only use the public booking page.' : 'Only the owner can manage this.'}</p>
                {role === 'client' && <Link href={`/book/?b=${business.slug}`} className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white">Open booking page</Link>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
