import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { dryRunMailer, type Mailer } from './lib/email.js';
import { HttpError } from './lib/errors.js';
import { createMemoryStore, type Store } from './lib/store.js';
import { planFromEvent, verifyStripeSignature } from './lib/stripe.js';
import { adminRouter } from './routes/admin.js';
import { publicRouter } from './routes/public.js';

export interface Config {
  clientUrl: string;
  stripeWebhookSecret?: string;
}

export function createApp(store: Store = createMemoryStore(), mailer: Mailer = dryRunMailer(), config: Config = { clientUrl: 'http://localhost:3000/bookflow-saas' }) {
  const app = express();
  app.use(cors({ origin: new URL(config.clientUrl).origin }));

  // Stripe needs the RAW body to check the signature → registered before express.json()
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
    const raw = (req.body as Buffer).toString('utf8');
    if (!config.stripeWebhookSecret || !verifyStripeSignature(raw, req.header('stripe-signature'), config.stripeWebhookSecret)) throw new HttpError(400, 'Invalid signature');
    const change = planFromEvent(JSON.parse(raw));
    if (change) store.setPlan(change.businessId, change.plan);
    res.json({ received: true });
  });

  app.use(express.json({ limit: '20kb' }));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/public', publicRouter(store, mailer));
  app.use('/api/admin', adminRouter(store));

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) return void res.status(400).json({ error: 'Validation failed', details: err.flatten().fieldErrors });
    if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  };
  app.use(onError);
  return app;
}
