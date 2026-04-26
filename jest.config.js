/** @type {import('jest').Config} */
module.exports = {
  testEnvironment:  'node',
  testMatch:        ['**/tests/api/**/*.test.js'],
  testTimeout:      30000,
  setupFiles:       [],
  verbose:          true,
  forceExit:        true,
  detectOpenHandles: true,
}
