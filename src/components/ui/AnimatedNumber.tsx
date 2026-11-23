'use client';

import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

export function AnimatedNumber({ value, format = (n) => Math.round(n).toString() }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) return void (el.textContent = format(value));
    const c = animate(0, value, { duration: 1, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => (el.textContent = format(v)) });
    return () => c.stop();
  }, [value, inView, reduce, format]);
  return <span ref={ref} className="tabular-nums">{format(0)}</span>;
}
