/**
 * server/.eslintrc.cjs — CommonJS Node rules for the API.
 */
module.exports = {
  env: { node: true, es2022: true, jest: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'script' },
  rules: {
    // The API is CommonJS; requiring a model inside a function is sometimes the
    // clearest way to break a circular import.
    'global-require': 'off',
    'import/no-dynamic-require': 'off',
    // Mongoose middleware needs `function` (not arrow) to keep `this` bound to the
    // document, and named function expressions make stack traces readable.
    'func-names': 'off',
    'prefer-arrow-callback': 'off',
    'no-param-reassign': ['error', { props: false }],
    // Helpers are hoisted below their first use so each file reads top-down.
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    // `ApiError.badRequest(message, options)` reads better than the reverse.
    'default-param-last': 'off',
  },
  overrides: [
    {
      files: ['tests/**/*.js', 'src/seed/**/*.js'],
      rules: {
        'no-console': 'off',
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
    },
  ],
};
