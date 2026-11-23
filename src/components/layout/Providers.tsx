'use client';

import { MotionConfig } from 'motion/react';
import { useHydrated } from '@/hooks/useHydrated';

export function Providers({ children }: { children: React.ReactNode }) {
  useHydrated(); // load localStorage data as soon as any page mounts
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
