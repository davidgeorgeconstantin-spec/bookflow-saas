import { createHmac } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { dryRunMailer } from '../src/lib/email.js';
import { createMemoryStore } from '../src/lib/store.js';
import type { Business, Service } from '../src/shared/types.js';

const allDay = { open: '00:00', close: '23:45' };
const hours = { 0: allDay, 1: allDay, 2: allDay, 3: allDay, 4: allDay, 5: allDay, 6: allDay } as Business['hours'];
const mkBiz = (id: string, plan: Business['plan'] = 'free'): Business => ({ id, slug: id, name: id.toUpperCase(), type: 'Salon', timezone: 'Europe/Bucharest', plan, color: '#000', hours, createdAt: '' });
const svc = (id: string, businessId: string): Service => ({ id, businessId, name: 'Cut', durationMin: 60, price: 100, color: '#000' });

function setup() {
  const store = createMemoryStore({
    businesses: [mkBiz('alpha', 'pro'), mkBiz('beta')],
    services: [svc('s-a', 'alpha'), svc('s-b1', 'beta'), svc('s-b2', 'beta'), svc('s-b3', 'beta')],
    tokens: { owner: { businessId: 'alpha', role: 'owner' }, staff: { businessId: 'alpha', role: 'staff' }, betaOwner: { businessId: 'beta', role: 'owner' } },
  });
  const mailer = dryRunMailer();
  return { app: createApp(store, mailer, { clientUrl: 'http://localhost:3000/bookflow-saas', stripeWebhookSecret: 'whsec_test' }), mailer };
}

const inThreeDays = new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
const customer = { name: 'Ana Pop', email: 'ana@example.com' };

describe('public booking API', () => {
  it('returns slots and books one, then the same slot is gone (409)', async () => {
    const { app, mailer } = setup();
    const slots = await request(app).get(`/api/public/businesses/alpha/slots?serviceId=s-a&date=${inThreeDays}`);
    expect(slots.status).toBe(200);
    const first = slots.body[0];
    const ok = await request(app).post('/api/public/businesses/alpha/bookings').send({ serviceId: 's-a', start: first.start, customer });
    expect(ok.status).toBe(201);
    expect(mailer.log.map((m) => m.subject)).toEqual(['Booking confirmed: Cut', 'Reminder: Cut tomorrow']); // Pro → reminder
    const again = await request(app).post('/api/public/businesses/alpha/bookings').send({ serviceId: 's-a', start: first.start, customer });
    expect(again.status).toBe(409);
  });

  it('validates input with Zod (400)', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/public/businesses/alpha/bookings').send({ serviceId: 's-a', start: 'tomorrow', customer: { name: 'A', email: 'nope' } });
    expect(res.status).toBe(400);
  });
});

describe('admin API (multi-tenant)', () => {
  it('needs a session (401) and keeps tenants apart', async () => {
    const { app } = setup();
    expect((await request(app).get('/api/admin/bookings')).status).toBe(401);
    const slots = await request(app).get(`/api/public/businesses/alpha/slots?serviceId=s-a&date=${inThreeDays}`);
    const booked = await request(app).post('/api/public/businesses/alpha/bookings').send({ serviceId: 's-a', start: slots.body[0].start, customer });

    const alpha = await request(app).get('/api/admin/bookings').set('Authorization', 'Bearer owner');
    const beta = await request(app).get('/api/admin/bookings').set('Authorization', 'Bearer betaOwner');
    expect(alpha.body).toHaveLength(1);
    expect(beta.body).toHaveLength(0);
    // beta cannot cancel alpha's booking even if it knows the id
    expect((await request(app).post(`/api/admin/bookings/${booked.body.id}/cancel`).set('Authorization', 'Bearer betaOwner')).status).toBe(404);
  });

  it('checks roles (staff cannot add services) and plan limits (402)', async () => {
    const { app } = setup();
    const body = { name: 'Styling', durationMin: 60, price: 150 };
    expect((await request(app).post('/api/admin/services').set('Authorization', 'Bearer staff').send(body)).status).toBe(403);
    expect((await request(app).post('/api/admin/services').set('Authorization', 'Bearer owner').send(body)).status).toBe(201);
    expect((await request(app).post('/api/admin/services').set('Authorization', 'Bearer betaOwner').send(body)).status).toBe(402); // Free: max 3
  });
});

describe('Stripe webhook', () => {
  const sign = (payload: string, secret = 'whsec_test') => {
    const t = Math.floor(Date.now() / 1000);
    return `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`;
  };

  it('rejects a bad signature and upgrades the plan on a valid event', async () => {
    const { app } = setup();
    const payload = JSON.stringify({ type: 'customer.subscription.created', data: { object: { status: 'active', metadata: { businessId: 'beta' } } } });
    const bad = await request(app).post('/api/webhooks/stripe').set('Content-Type', 'application/json').set('Stripe-Signature', sign(payload, 'wrong')).send(payload);
    expect(bad.status).toBe(400);
    const good = await request(app).post('/api/webhooks/stripe').set('Content-Type', 'application/json').set('Stripe-Signature', sign(payload)).send(payload);
    expect(good.status).toBe(200);
    // beta is now Pro → a 4th service is allowed
    const res = await request(app).post('/api/admin/services').set('Authorization', 'Bearer betaOwner').send({ name: 'Styling', durationMin: 60, price: 150 });
    expect(res.status).toBe(201);
  });
});
