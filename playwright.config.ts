import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  reportSlowTests: {
    max: 0,
    threshold: 60000,
  },
  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ['html', { open: 'never', outputFile: 'index.html', outputFolder: 'e2e-test-results' }],
    ['json', { outputFile: 'e2e-test-results/json-results.json' }],
    ['junit', { outputFile: 'e2e-test-results/junit-results.xml' }],
  ],
  retries: 0,
  testDir: './e2e-tests',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    trace: process.env.CI ? 'retain-on-failure' : 'off',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
  webServer: {
    command: 'npm run preview',
    port: 3000,
  },
};

export default config;
