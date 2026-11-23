import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { HttpError } from '../lib/errors.js';
import type { Store } from '../lib/store.js';
import { canAddService } from '../shared/plans.js';

type Session = { businessId: string; role: 'owner' | 'staff' };
declare module 'express-serve-static-core' {
  interface Request { tenant?: Session }
}

/** Reads `Authorization: Bearer <token>` and attaches the tenant. In production: a real auth provider (JWT). */
const auth = (store: Store): RequestHandler => (req, _res, next) => {
  const token = req.header('authorization')?.replace(/^Bearer /, '');
  const session = token ? store.session(token) : undefined;
  if (!session) throw new HttpError(401, 'Not signed in');
  req.tenant = session;
  next();
};

const requireRole = (...roles: Session['role'][]): RequestHandler => (req, _res, next) => {
  if (!req.tenant || !roles.includes(req.tenant.role)) throw new HttpError(403, 'Not allowed for your role');
  next();
};

const ServiceInput = z.object({ name: z.string().trim().min(2).max(60), durationMin: z.number().int().min(15).max(480), price: z.number().min(0), color: z.string().default('#6366f1') });

/** Dashboard API. The businessId ALWAYS comes from the session, never from the URL or body. */
export function adminRouter(store: Store) {
  const r = Router();
  r.use(auth(store));

  r.get('/bookings', requireRole('owner', 'staff'), (req, res) => {
    res.json(store.bookings(req.tenant!.businessId));
  });

  r.post('/bookings/:id/cancel', requireRole('owner', 'staff'), (req, res) => {
    const b = store.cancelBooking(req.tenant!.businessId, String(req.params.id));
    if (!b) throw new HttpError(404, 'Booking not found'); // also when it belongs to ANOTHER business
    res.json(b);
  });

  r.post('/services', requireRole('owner'), (req, res) => {
    const businessId = req.tenant!.businessId;
    const business = store.businessById(businessId)!;
    if (!canAddService(business.plan, store.services(businessId).length)) throw new HttpError(402, 'Upgrade to Pro to add more services');
    res.status(201).json(store.addService(businessId, ServiceInput.parse(req.body)));
  });

  return r;
}
