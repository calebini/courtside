import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  // Browser cases mutate one disposable seeded League and Auth project.
  // Serialize files so their fixtures and email rate limits cannot race.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']}
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000/en',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
