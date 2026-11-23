'use client';

import { useEffect, useState } from 'react';
import { useData } from '@/features/tenancy/store';

/**
 * True after localStorage data was loaded (we skip automatic hydration to match the static HTML).
 * On the server there is no localStorage, so `useData.persist` is undefined → we return false.
 */
export function useHydrated() {
  const [done, setDone] = useState(() => useData.persist?.hasHydrated() ?? false);
  useEffect(() => {
    const api = useData.persist;
    if (!api) return;
    const off = api.onFinishHydration(() => setDone(true));
    if (!api.hasHydrated()) void api.rehydrate();
    else setDone(true);
    return off;
  }, []);
  return done;
}
