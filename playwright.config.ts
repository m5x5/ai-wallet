import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'component',
      testMatch: 'tests/component/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'react-integration',
      testMatch: 'tests/react-integration/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'examples',
      testMatch: 'tests/examples/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
