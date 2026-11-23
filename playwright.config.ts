import { defineConfig, devices } from '@playwright/test';

/** End-to-end tests against the static export (`out/`), served like GitHub Pages under /bookflow-saas/. */
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4321/bookflow-saas/', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], ...(process.env.CHROME_PATH ? { launchOptions: { executablePath: process.env.CHROME_PATH } } : {}) } }],
  webServer: { command: 'node e2e/serve.mjs', port: 4321, reuseExistingServer: !process.env.CI },
});
