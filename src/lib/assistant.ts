import type { Business, Service } from '@/types';
import { formatMoney } from './money';
import { hhmm, minutesOf } from './time';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * DEMO assistant for the public booking page — rule-based, NOT an AI model.
 * It only answers from the business data (hours, services, prices), like a RAG system would.
 */
export function answerClient(question: string, business: Business, services: Service[]): string {
  const q = norm(question);
  const service = services.find((s) => norm(s.name).split(' ').some((w) => w.length > 3 && q.includes(w)));

  if (/\b(hour|open|close|program|deschis|orar|when)/.test(q)) {
    const lines = ([1, 2, 3, 4, 5, 6, 0] as const).map((d) => {
      const h = business.hours[d];
      return `${DAYS[d]}: ${h ? `${h.open}–${h.close}` : 'closed'}`;
    });
    return `Our opening hours (${business.timezone}):\n${lines.join('\n')}`;
  }
  if (service && /\b(price|cost|how much|cat costa|pret|long|durat|minute)/.test(q))
    return `${service.name} costs ${formatMoney(service.price)} and takes ${service.durationMin} minutes.`;
  if (/\b(price|cost|how much|pret|services|servicii|menu|list)/.test(q))
    return `Our services:\n${services.map((s) => `• ${s.name} — ${formatMoney(s.price)}, ${s.durationMin} min`).join('\n')}`;
  if (/\b(cancel|anula|reschedul|change)/.test(q)) return 'To cancel or change a booking, reply to your confirmation email or contact the business directly. (Demo: online cancellation is in the owner calendar.)';
  if (/\b(book|appointment|programare|reserve|free|available|liber)/.test(q)) return 'Pick a service on the left, then a day and a free time slot. It takes less than a minute!';
  if (/^(hi|hello|hey|salut|buna)/.test(q)) return `Hi! I'm the ${business.name} assistant (demo). Ask me about services, prices or opening hours.`;
  return "I can only answer questions about our services, prices and opening hours. Try: \"How much is a haircut?\"";
}

export const describeHours = (open: string, close: string) => `${hhmm(minutesOf(open))}–${hhmm(minutesOf(close))}`;
