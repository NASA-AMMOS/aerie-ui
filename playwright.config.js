/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ['html', { open: 'never', outputFile: 'index.html', outputFolder: 'test-results' }],
    ['json', { outputFile: 'test-results/json-results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
  ],
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
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
