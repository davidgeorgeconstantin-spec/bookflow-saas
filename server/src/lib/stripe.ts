import { createHmac, timingSafeEqual } from 'node:crypto';

/** Verifies the `Stripe-Signature` header (t=timestamp,v1=hmac) — same as project 6. */
export function verifyStripeSignature(rawBody: string, header: string | undefined, secret: string, toleranceSec = 300): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=') as [string, string]));
  const t = Number(parts.t);
  const sig = parts.v1;
  if (!t || !sig || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  return expected.length === sig.length && timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

/**
 * Subscription events → plan. We put `metadata.businessId` on the Stripe subscription
 * when creating the Checkout session (mode: 'subscription'), so the webhook knows the tenant.
 */
export function planFromEvent(event: { type: string; data: { object: { status?: string; metadata?: Record<string, string> } } }): { businessId: string; plan: 'free' | 'pro' } | null {
  const obj = event.data.object;
  const businessId = obj.metadata?.businessId;
  if (!businessId) return null;
  if (event.type === 'customer.subscription.deleted') return { businessId, plan: 'free' };
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated')
    return { businessId, plan: obj.status === 'active' || obj.status === 'trialing' ? 'pro' : 'free' };
  return null;
}
