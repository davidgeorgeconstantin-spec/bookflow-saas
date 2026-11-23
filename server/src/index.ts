import { createApp } from './app.js';
import { dryRunMailer, resendMailer } from './lib/email.js';
import { createMemoryStore } from './lib/store.js';
import { devSeed } from './seed.js';

const env = process.env;
const mailer = env.RESEND_API_KEY ? resendMailer(env.RESEND_API_KEY, env.EMAIL_FROM ?? 'BookFlow <onboarding@resend.dev>') : dryRunMailer();
const app = createApp(createMemoryStore(devSeed), mailer, {
  clientUrl: env.CLIENT_URL ?? 'http://localhost:3000/bookflow-saas',
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || undefined,
});

const port = Number(env.PORT ?? 4000);
app.listen(port, () => console.log(`BookFlow API on http://localhost:${port}${env.RESEND_API_KEY ? '' : ' (emails: dry run)'}`));
