import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

function envOrNumber(name: string, fallback: number): number {
  const v = process.env[name];
  if (typeof v !== 'undefined' && v !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

// CI detection — update CI_ENV_VAR in SETUP-QUESTIONNAIRE.md once your CI platform is known
const isCI = process.env.CI === 'true'
  || process.env.AZURE === 'true'
  || process.env.AZURE_TESTING === 'true'
  || process.env.AWS_CODEBUILD === 'true'
  || process.env.GITHUB_ACTIONS === 'true';

const playwrightTimeout = envOrNumber('PLAYWRIGHT_TIMEOUT', isCI ? 1200000 : 600000);
const actionTimeout = envOrNumber('ACTION_TIMEOUT', isCI ? 60000 : 30000);
const expectTimeout = envOrNumber('EXPECT_TIMEOUT', isCI ? 30000 : 15000);
const navigationTimeout = envOrNumber('NAVIGATION_TIMEOUT', isCI ? 300000 : 90000);

const workersEnv = process.env.Workers;
const workers = (() => {
  if (workersEnv) {
    const n = Number(workersEnv);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return isCI ? 2 : 4;
})();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers,
  timeout: playwrightTimeout,
  maxFailures: 0,

  expect: {
    timeout: expectTimeout,
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    actionTimeout,
    navigationTimeout,
    trace: isCI ? 'retain-on-failure' : 'on',
    headless: isCI,
    screenshot: isCI ? 'only-on-failure' : 'on',
    video: 'retain-on-failure',
    storageState: 'storageState.json',
    ignoreHTTPSErrors: true,
  },

  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report', open: isCI ? 'never' : 'on-failure' }],
    ['json', { outputFile: 'reports/results.json' }],
    ...(isCI ? [['junit', { outputFile: 'reports/junit.xml' }] as const] : []),
  ],

  projects: [
    {
      name: 'setup',
      testMatch: /.*global-setup\.ts/,
      use: { storageState: undefined },
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(isCI
          ? {
            launchOptions: {
              args: [
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-extensions',
                '--disable-blink-features=AutomationControlled',
              ],
            },
          }
          : {}),
      },
      dependencies: ['setup'],
    },
  ],

  outputDir: 'test-results',
});
