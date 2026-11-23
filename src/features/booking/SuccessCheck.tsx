'use client';

import { motion } from 'motion/react';

/** Animated check: circle draws, then the tick (SVG pathLength). */
export function SuccessCheck() {
  return (
    <svg viewBox="0 0 80 80" className="mx-auto h-20 w-20" aria-hidden>
      <motion.circle cx="40" cy="40" r="36" fill="none" stroke="#10b981" strokeWidth="5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      <motion.path d="M24 41 l11 11 l21 -23" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.35 }} />
    </svg>
  );
}
