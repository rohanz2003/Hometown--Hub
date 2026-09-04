/**
 * config/env.js — the single place the client reads build-time configuration.
 *
 * Keeping `import.meta.env` in one module means every other file is plain ES that
 * runs unchanged under Jest (which maps this module to a stub).
 */
const env = import.meta.env || {};

/** Origin of the REST API. Empty in development, where Vite proxies `/api`. */
export const API_BASE_URL = env.VITE_API_BASE_URL || '';

export const IS_PRODUCTION = env.PROD === true;
