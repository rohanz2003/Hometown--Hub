/**
 * utils/tokens.js — JWT issuing and verification.
 *
 * Two-token scheme (rules.md forbids keeping secrets in client storage):
 *  - short-lived access token, returned in the JSON body and held in memory by
 *    the client;
 *  - long-lived refresh token, sent only as an httpOnly cookie.
 *
 * `tv` (token version) lets a password change or "sign out everywhere" action
 * invalidate every refresh token that was issued earlier.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const REFRESH_COOKIE_NAME = 'hh_refresh';

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, tv: user.tokenVersion || 0 },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, issuer: 'hometown-hub' },
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: String(user._id), tv: user.tokenVersion || 0 }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'hometown-hub',
  });
}

const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'hometown-hub' });

const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: 'hometown-hub' });

/** Parses a duration such as `30d` / `15m` into milliseconds. */
function durationToMs(value) {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(String(value).trim());
  if (!match) return Number(value) || 0;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const factors = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return amount * factors[unit];
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
  };
}

/** Attaches the refresh token as an httpOnly cookie. */
function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions(), maxAge: undefined });
}

/** Reads the bearer token from the Authorization header, if present. */
function bearerFrom(req) {
  const header = req.headers.authorization || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

module.exports = {
  REFRESH_COOKIE_NAME,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  refreshCookieOptions,
  durationToMs,
  bearerFrom,
};
