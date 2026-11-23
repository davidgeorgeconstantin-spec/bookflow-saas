# BookFlow — Soluții

## Lecția 1
În `bookflow:data` → `state.bookings` vei vedea programări cu `"businessId": "demo-aurora"` și (după ce faci o programare pe pagina noii firme) altele cu ID-ul noii firme. Dashboard-ul folosește `useTenant((s) => s.bookings, business.id)`, deci fiecare firmă își vede doar programările ei.

## Lecția 2
```ts
it('converts Tokyo time (no DST)', () => {
  expect(zonedToUtc('2026-11-24', '09:00', 'Asia/Tokyo').toISOString()).toBe('2026-11-24T00:00:00.000Z');
  expect(zonedToUtc('2026-07-01', '09:00', 'Asia/Tokyo').toISOString()).toBe('2026-07-01T00:00:00.000Z');
});
```

## Lecția 3
În `lib/slots.ts` adaugă un parametru și extinde intervalul ocupat:
```ts
export function availableSlots(opts: { /* ... */ bufferMin?: number }): Slot[] {
  const { /* ... */ bufferMin = 0 } = opts;
  // ...
  const taken = bookings
    .filter((b) => b.businessId === business.id && b.status === 'confirmed')
    .map((b) => [Date.parse(b.start), Date.parse(b.end) + bufferMin * 60000] as const);
```
Test (în `slots.test.ts`):
```ts
it('keeps a buffer after each booking', () => {
  const bookings = [booking('2026-11-23T07:00:00.000Z', '2026-11-23T08:00:00.000Z')]; // 09:00–10:00
  const labels = availableSlots({ business, service, dateKey: '2026-11-23', bookings, now: past, bufferMin: 10 }).map((s) => s.label);
  expect(labels[0]).toBe('10:15'); // 10:00 is blocked by the 10-minute buffer
});
```
(Pasul e 15 minute, deci primul slot liber după 10:10 este 10:15.)

## Lecția 4
În `features/tenancy/RoleSwitcher.tsx`:
```ts
'/app/emails': ['owner', 'staff'],
```
`/app/billing` rămâne `['owner']`, deci testul e2e trece. Pe server ai face la fel: `requireRole('owner', 'staff')` pe ruta de emailuri.

## Lecția 5
`server/src/lib/email.ts`:
```ts
export async function sendCancellationEmail(mailer: Mailer, b: Booking, business: Business) {
  await mailer.send({ to: b.customer.email, subject: 'Booking cancelled', html: `<p>Hi ${esc(b.customer.name)}, your booking at ${esc(business.name)} was cancelled.</p>` });
}
```
`server/src/routes/admin.ts` — routerul primește și `mailer`:
```ts
r.post('/bookings/:id/cancel', requireRole('owner', 'staff'), async (req, res) => {
  const b = store.cancelBooking(req.tenant!.businessId, String(req.params.id));
  if (!b) throw new HttpError(404, 'Booking not found');
  await sendCancellationEmail(mailer, b, store.businessById(b.businessId)!);
  res.json(b);
});
```
În `app.ts`: `app.use('/api/admin', adminRouter(store, mailer));`. Test:
```ts
await request(app).post(`/api/admin/bookings/${id}/cancel`).set('Authorization', 'Bearer owner');
expect(mailer.log.at(-1)?.subject).toBe('Booking cancelled');
```

## Lecția 6
```ts
test('owner cancels a booking from the calendar', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: /Open the demo business/ }).click();
  await page.waitForURL(/\/app\/$/);
  await page.goto('app/calendar/');
  const blocks = page.locator('button[style*="top"]');
  const before = await blocks.count();
  await blocks.first().click();
  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await expect(blocks).toHaveCount(before - 1);
});
```
