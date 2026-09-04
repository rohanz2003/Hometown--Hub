/**
 * jest.config.js — backend test configuration.
 *
 * Integration tests drive the real Express app with supertest against a
 * dedicated `hometown_hub_test` database (see `tests/setup.js`).
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/seed/**', '!src/index.js'],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  clearMocks: true,
  verbose: false,
};
