/**
 * middleware/rateLimit.js — request throttling.
 *
 * Auth endpoints are rate-limited to blunt credential stuffing
 * (rules.md § Security & privacy). Limits are relaxed under NODE_ENV=test so the
 * suite is not throttled by its own fixtures.
 */
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { sendError } = require('../utils/response');

function handler(req, res) {
  return sendError(res, {
    status: 429,
    message: 'Too many attempts. Please wait a minute and try again.',
    code: 'RATE_LIMITED',
  });
}

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => env.isTest,
};

/** Login / register / password-reset: strict. */
const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 20 });

/** Content creation: generous but bounded, to limit spam floods. */
const writeLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 40 });

/** Everything else: a wide safety net. */
const globalLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 600 });

module.exports = { authLimiter, writeLimiter, globalLimiter };
