import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

export default defineConfig({
  testDir: './visual-tests',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'line',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173/GreedySweeper/',
    colorScheme: 'dark',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    cwd: resolve(import.meta.dirname, '../..'),
    url: 'http://127.0.0.1:4173/GreedySweeper/visual.html',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
