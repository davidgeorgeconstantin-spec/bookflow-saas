import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingFlow } from '@/features/booking/BookingFlow';

export const metadata: Metadata = { title: 'Book an appointment' };

// Static export: the business comes from ?b=slug (read on the client), so we wrap it in Suspense.
export default function BookPage() {
  return (
    <Suspense>
      <BookingFlow />
    </Suspense>
  );
}
