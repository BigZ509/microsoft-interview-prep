import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';

// Reuse a locally cached Chrome for Testing build when present (avoids a browser download).
const cached = `${homedir()}/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const launchOptions = existsSync(cached) ? { executablePath: cached } : {};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3123', timezoneId: 'America/New_York', launchOptions },
  webServer: { command: 'npx next start --hostname 127.0.0.1 --port 3123', url: 'http://127.0.0.1:3123', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
