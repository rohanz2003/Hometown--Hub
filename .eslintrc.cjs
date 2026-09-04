/**
 * .eslintrc.cjs — root ESLint config (Airbnb base + Prettier).
 *
 * Per-workspace overrides live in `client/.eslintrc.cjs` and `server/.eslintrc.cjs`.
 */
module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  extends: ['airbnb-base', 'prettier'],
  ignorePatterns: ['node_modules/', 'dist/', 'coverage/', 'client/dist/'],
  rules: {
    // Prettier owns formatting; ESLint stays on correctness.
    'max-len': 'off',
    'object-curly-newline': 'off',
    'implicit-arrow-linebreak': 'off',
    'function-paren-newline': 'off',
    'operator-linebreak': 'off',
    'arrow-body-style': 'off',
    'no-confusing-arrow': 'off',
    'no-nested-ternary': 'off',
    'no-underscore-dangle': ['error', { allow: ['_id', '__isRetry'] }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'import/prefer-default-export': 'off',
    'import/extensions': ['error', 'ignorePackages', { js: 'never', jsx: 'never' }],
  },
};
