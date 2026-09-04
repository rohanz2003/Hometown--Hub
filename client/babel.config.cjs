/**
 * babel.config.cjs — used by Jest only. Vite handles JSX for the real build.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
