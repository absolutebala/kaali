const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir:    './tests/e2e',
  timeout:    30000,
  retries:    1,
  workers:    2,
  reporter:   [['html', { open: 'never' }], ['list']],

  use: {
    baseURL:       process.env.TEST_BASE_URL || 'https://kaali-complete-git-staging-oohads.vercel.app',
    headless:      true,
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    trace:         'retain-on-failure',
  },

  projects: [
    {
      name:  'chromium',
      use:   { ...devices['Desktop Chrome'] },
    },
  ],
})
