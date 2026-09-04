/**
 * client/.eslintrc.cjs — React rules for the web client.
 *
 * Airbnb's React config re-enables a few base rules the root config relaxes, so
 * those relaxations are repeated here.
 */
module.exports = {
  env: { browser: true, es2022: true, jest: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  extends: ['airbnb', 'airbnb/hooks', 'prettier'],
  settings: { react: { version: 'detect' } },
  rules: {
    // The new JSX runtime means React does not need to be in scope.
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],
    // Presentational components take a props bag by design.
    'react/jsx-props-no-spreading': 'off',
    // PropTypes are omitted deliberately: the API response shapes are documented in
    // the service layer and exercised by tests.
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'jsx-a11y/label-has-associated-control': ['error', { assert: 'either' }],

    // `_id` is Mongo's field name and appears throughout the API payloads.
    'no-underscore-dangle': ['error', { allow: ['_id', '__isRetry'] }],
    // A short nested ternary is clearer than an if/else chain inside JSX.
    'no-nested-ternary': 'off',
    'no-param-reassign': ['error', { props: false }],
    // Noisy when a module exports both a default and a like-named binding.
    'import/no-named-as-default': 'off',
    'import/prefer-default-export': 'off',
    'import/extensions': ['error', 'ignorePackages', { js: 'never', jsx: 'never' }],
    'max-len': 'off',
    // `forwardRef(function Button(...))` is the idiomatic form — the name is what
    // shows up in React DevTools and in component stack traces.
    'prefer-arrow-callback': 'off',
    // Helper functions are hoisted below their first use so each file reads top-down.
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
  },
  overrides: [
    {
      files: ['**/*.test.{js,jsx}', 'src/test/**/*.{js,jsx}'],
      rules: {
        // Test-only tooling belongs in devDependencies.
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
    },
  ],
};
