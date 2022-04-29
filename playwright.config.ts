import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ['html', { open: 'never', outputFile: 'index.html', outputFolder: 'test-results' }],
    ['json', { outputFile: 'test-results/json-results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
  ],
  retries: process.env.CI ? 1 : 0,
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    trace: process.env.CI ? 'on-first-retry' : 'off',
    video: process.env.CI ? 'on-first-retry' : 'off',
  },
  webServer: {
    command: 'node build',
    env: {
      AUTH_TYPE: 'none',
      ORIGIN: 'http://localhost:3000',
    },
    port: 3000,
  },
};

export default config;
