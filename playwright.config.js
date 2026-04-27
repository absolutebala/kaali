const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir:    './tests/e2e',
  timeout:    60000,
  retries:    1,
  workers:    1,
  reporter:   [['html', { open: 'never' }], ['list']],

  use: {
    baseURL:       process.env.TEST_BASE_URL || 'https://kaali-complete-git-staging-oohads.vercel.app',
    headless:      true,
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    trace:         'retain-on-failure',
    extraHTTPHeaders: process.env.VERCEL_BYPASS_TOKEN
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_BYPASS_TOKEN }
      : {},
  },

  projects: [
    {
      name:  'chromium',
      use:   { ...devices['Desktop Chrome'] },
    },
  ],
})
