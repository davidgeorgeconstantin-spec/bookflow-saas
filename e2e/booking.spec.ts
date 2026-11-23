import { expect, test } from '@playwright/test';

test('a client books an appointment and the owner sees it', async ({ page }) => {
  await page.goto('book/?b=studio-aurora');
  await page.getByRole('button', { name: /Beard trim/ }).click();
  await page.locator('button.min-w-16:not([disabled])').nth(2).click();
  const slot = page.locator('.grid-cols-4 button').first();
  const time = (await slot.textContent())!.trim();
  await slot.click();
  await page.getByLabel('Name').fill('Test Client');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByRole('button', { name: /^Confirm/ }).click();
  await expect(page.getByText("You're booked!")).toBeVisible();

  // the slot is gone now (no double booking)
  await page.getByRole('button', { name: 'Book another' }).click();
  await page.getByRole('button', { name: /Beard trim/ }).click();
  await page.locator('button.min-w-16:not([disabled])').nth(2).click();
  await expect(page.locator('.grid-cols-4 button', { hasText: new RegExp(`^${time}$`) })).toHaveCount(0);

  // the confirmation email is in the owner's outbox
  await page.goto('app/emails/');
  await expect(page.getByText('test@example.com').first()).toBeVisible();
});

test('the Free plan limits services to 3', async ({ page }) => {
  await page.goto('signup/');
  await page.getByLabel('Business name').fill('E2E Studio');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Your name').fill('Owner');
  await page.getByRole('button', { name: 'Create business' }).click();
  await page.waitForURL(/\/app\/$/);
  await page.goto('app/services/');
  for (const name of ['One', 'Two', 'Three', 'Four']) {
    await page.getByLabel('Service name').fill(name);
    await page.getByRole('button', { name: '+ Add service' }).click();
  }
  await expect(page.getByText(/Free plan allows up to 3 services/)).toBeVisible();
});

test('staff cannot open billing', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: /Open the demo business/ }).click();
  await page.waitForURL(/\/app\/$/);
  await page.getByRole('button', { name: 'Staff' }).click();
  await page.goto('app/billing/');
  await expect(page.getByText(/not allowed|only the owner|no access/i).first()).toBeVisible();
});
