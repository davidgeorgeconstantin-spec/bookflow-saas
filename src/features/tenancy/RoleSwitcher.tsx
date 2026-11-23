'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import type { Role } from '@/types';
import { useData } from './store';

const ROLES: { id: Role; label: string }[] = [
  { id: 'owner', label: 'Owner' },
  { id: 'staff', label: 'Staff' },
  { id: 'client', label: 'Client' },
];

/** Demo helper: switch roles to see what each one is allowed to do. */
export function RoleSwitcher() {
  const role = useData((s) => s.session.role);
  const setRole = useData((s) => s.setRole);
  return (
    <div>
      <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">View as (demo)</p>
      <div className="flex rounded-xl bg-slate-100 p-1">
        {ROLES.map((r) => (
          <button key={r.id} onClick={() => setRole(r.id)} className={cn('relative flex-1 rounded-lg py-1.5 text-xs font-semibold', role === r.id ? 'text-slate-900' : 'text-slate-500')}>
            {role === r.id && <motion.span layoutId="role-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
            <span className="relative">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Which roles can open which page. Checked in the layout (like middleware on a server). */
export const PERMISSIONS: Record<string, Role[]> = {
  '/app': ['owner', 'staff'],
  '/app/calendar': ['owner', 'staff'],
  '/app/services': ['owner'],
  '/app/emails': ['owner'],
  '/app/billing': ['owner'],
};
