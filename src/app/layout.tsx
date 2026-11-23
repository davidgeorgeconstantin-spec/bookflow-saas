import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/layout/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'BookFlow — online bookings for small businesses', template: '%s · BookFlow' },
  description: 'A multi-tenant booking SaaS (learning project): public booking pages, calendar, services, time zones, email reminders, statistics and Free/Pro plans. Demo runs in the browser.',
  icons: { icon: '/bookflow-saas/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
