# BookFlow — Lecții (în română)

Proiectul 10, proiectul final: o aplicație SaaS de programări. Aici legi tot ce ai învățat în proiectele 1–9 și înveți cum gândești un **produs**, nu doar o pagină.

## Lecția 1 — Ce înseamnă multi-tenant
„Tenant” = un client al platformei (aici: o firmă, de ex. *Studio Aurora*). Toate firmele folosesc **aceeași aplicație și aceeași bază de date**, dar fiecare își vede doar datele ei.
Regula de aur: **fiecare înregistrare are `businessId`**, iar fiecare citire filtrează după el.
- În browser: `useTenant(pick, businessId)` din `features/tenancy/store.ts` filtrează listele.
- Pe server: `businessId` vine din **sesiune** (`req.tenant`), niciodată din URL sau din body. Altfel oricine ar putea schimba ID-ul din URL și ar vedea datele altei firme.
- În PostgreSQL poți adăuga și **Row Level Security** (ai văzut în proiectul 5).

**Exercițiu:** creează două firme (una demo, una nouă din `/signup`). Verifică în DevTools → Application → Local Storage → `bookflow:data` că programările au `businessId` diferit și că dashboard-ul fiecărei firme arată doar ale ei.

## Lecția 2 — Fusuri orare: salvezi în UTC, afișezi local
Un client din Londra face programare la un salon din București. Ce oră salvăm?
- **Salvăm mereu în UTC** (`2026-11-24T07:00:00.000Z`).
- **Calculăm și afișăm în fusul orar al firmei** (`Europe/Bucharest` → 09:00).
- Ora de vară (DST) schimbă diferența: iarna București = UTC+2, vara UTC+3. De aceea `zonedToUtc` din `lib/time.ts` verifică de două ori offset-ul.
Folosim doar `Intl.DateTimeFormat` — fără nicio bibliotecă.

**Exercițiu:** în `lib/time.test.ts` adaugă un test pentru `Asia/Tokyo` (UTC+9, fără oră de vară): `zonedToUtc('2026-11-24', '09:00', 'Asia/Tokyo')` trebuie să dea `2026-11-24T00:00:00.000Z`.

## Lecția 3 — Algoritmul de sloturi libere
`availableSlots` din `lib/slots.ts` e o **funcție pură** (aceleași date de intrare → același rezultat), deci e ușor de testat și rulează identic în browser și pe server (`server/src/shared`).
Pașii:
1. ia programul zilei (luni 09:00–18:00); dacă e închis → nimic;
2. mergi din 15 în 15 minute; serviciul trebuie să se termine înainte de închidere;
3. elimină sloturile care se **suprapun** cu o programare confirmată: `aStart < bEnd && bStart < aEnd`;
4. elimină sloturile din trecut + un **preaviz minim** (60 min).
**Atenție:** lista de sloturi poate fi veche (doi clienți aleg același slot). De aceea `book()` și serverul **verifică din nou** înainte să salveze (serverul răspunde 409).

**Exercițiu:** adaugă o **pauză** (buffer) de 10 minute după fiecare programare (timp de curățenie). Modifică `availableSlots` și scrie un test.

## Lecția 4 — Roluri și permisiuni
Trei roluri: **owner** (vede tot), **staff** (calendar și dashboard, fără venituri și fără setări), **client** (doar pagina publică).
- `PERMISSIONS` din `RoleSwitcher.tsx` spune ce rol are voie pe ce pagină; `AppShell` arată „Not allowed” altfel.
- Ascunderea unui buton **nu e securitate**. Securitatea reală e pe server: `requireRole('owner')` în `server/src/routes/admin.ts` → 403.
- Mai e o diferență: **401** = nu ești logat; **403** = ești logat, dar n-ai voie; **402** = trebuie să plătești (limita planului).

**Exercițiu:** permite rolului `staff` să vadă pagina Emails, dar nu Billing. Schimbă `PERMISSIONS` și testul Playwright „staff cannot open billing” trebuie să treacă în continuare.

## Lecția 5 — Abonamente și emailuri (Stripe test, Resend)
- **Planuri:** `lib/plans.ts` ține limitele (Free: 3 servicii, 30 programări/lună). Verificarea se face într-un singur loc (`canAddService`, `canAcceptBooking`), folosit și de UI și de server.
- **Stripe Billing (test):** clientul plătește pe pagina Stripe; Stripe trimite un **webhook** (`customer.subscription.updated`) la server. Serverul verifică **semnătura** (HMAC) și abia apoi schimbă planul. Nu schimbi niciodată planul doar pentru că browserul a zis „am plătit”.
- **Resend:** confirmarea se trimite imediat; reminderul cu `scheduled_at` = cu 24h înainte — Resend îl trimite singur, fără cron.
- Fără chei API, serverul face **dry run** (doar loghează). Cheile stau în `.env`, niciodată în cod.

**Exercițiu:** la anularea unei programări, serverul trebuie să trimită un email „Booking cancelled”. Adaugă funcția în `server/src/lib/email.ts`, apeleaz-o în ruta de cancel și verifică în test că `mailer.log` conține emailul.

## Lecția 6 — Teste pe trei niveluri + CI
| Nivel | Unealtă | Ce prinde |
|---|---|---|
| Unit | Vitest | greșeli de logică (sloturi, fusuri orare, limite) |
| Integrare | Supertest | API: validare, coduri HTTP, separarea firmelor |
| End-to-end | Playwright | fluxul real din browser: client face programare → apare emailul |
GitHub Actions le rulează automat la fiecare push (`deploy.yml`, `server-tests.yml`, `e2e.yml`). Dacă un test pică, site-ul nu se publică.
Animații: GSAP pentru scroll (landing), Motion pentru UI (layoutId, AnimatePresence). Ambele respectă `prefers-reduced-motion`.

**Exercițiu:** scrie un test Playwright: deschide demo-ul, mergi în Calendar, apasă pe o programare, apasă „Cancel booking” și verifică că blocul dispare (fără „Show cancelled”).

---
**Întrebări de interviu (exersează răspunsurile cu voce tare):**
1. Ce e o aplicație multi-tenant și cum previi scurgerea datelor între firme?
2. De ce salvezi datele în UTC?
3. Cum previi dubla programare (în aplicație și în baza de date)?
4. Care e diferența dintre 401, 403 și 402?
5. De ce verifici semnătura unui webhook?
6. Ce testezi cu unit tests și ce cu teste end-to-end?
