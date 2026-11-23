import type { Booking, Business, Service } from '../shared/types.js';

export interface Mailer {
  send(msg: { to: string; subject: string; html: string; scheduledAt?: string }): Promise<{ id: string | null }>;
}

/** Resend REST API (free plan). `scheduled_at` lets Resend send the reminder later — no cron needed. */
export function resendMailer(apiKey: string, from: string): Mailer {
  return {
    async send({ to, subject, html, scheduledAt }) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, html, ...(scheduledAt ? { scheduled_at: scheduledAt } : {}) }),
      });
      if (!res.ok) throw new Error(`Resend error ${res.status}`);
      return (await res.json()) as { id: string };
    },
  };
}

/** No API key → just log (and remember, for tests). */
export function dryRunMailer(log: { to: string; subject: string; scheduledAt?: string }[] = []): Mailer & { log: typeof log } {
  return {
    log,
    async send(msg) {
      log.push({ to: msg.to, subject: msg.subject, scheduledAt: msg.scheduledAt });
      return { id: null };
    },
  };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function sendBookingEmails(mailer: Mailer, b: Booking, business: Business, service: Service) {
  const when = new Intl.DateTimeFormat('en-GB', { timeZone: business.timezone, dateStyle: 'full', timeStyle: 'short' }).format(new Date(b.start));
  const html = `<p>Hi ${esc(b.customer.name)},</p><p>your <b>${esc(service.name)}</b> at ${esc(business.name)} is booked for <b>${when}</b>.</p>`;
  await mailer.send({ to: b.customer.email, subject: `Booking confirmed: ${service.name}`, html });
  if (business.plan === 'pro') {
    const reminderAt = new Date(Date.parse(b.start) - 24 * 3600_000);
    if (reminderAt.getTime() > Date.now()) await mailer.send({ to: b.customer.email, subject: `Reminder: ${service.name} tomorrow`, html, scheduledAt: reminderAt.toISOString() });
  }
}
