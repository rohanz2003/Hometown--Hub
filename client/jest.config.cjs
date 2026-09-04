/**
 * jest.config.cjs — frontend test configuration (Jest + React Testing Library).
 *
 * `config/env` is mapped to a stub because the real module reads `import.meta.env`,
 * which only exists under Vite.
 */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
  moduleNameMapper: {
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
    '^(.*)/config/env$': '<rootDir>/src/config/__mocks__/env.js',
  },
  transform: { '^.+\\.(js|jsx)$': 'babel-jest' },
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx', '!src/test/**'],
  coverageDirectory: 'coverage',
  testTimeout: 15000,
  clearMocks: true,
};
