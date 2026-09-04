/**
 * services/api.js — the single axios instance used by every feature.
 *
 * The access token is held in module memory (never localStorage, per
 * rules.md § What to Avoid). The long-lived refresh token lives in an httpOnly
 * cookie, so a 401 is transparently retried once after refreshing.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/env';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
  timeout: 20000,
});

/* ── Access token (in-memory) ──────────────────────────────────────────────── */

let accessToken = null;
let onSessionLost = () => {};

export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const getAccessToken = () => accessToken;

/** Lets AuthContext react when the session can no longer be recovered. */
export const setSessionLostHandler = (handler) => {
  onSessionLost = typeof handler === 'function' ? handler : () => {};
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/* ── Transparent refresh ───────────────────────────────────────────────────── */

// Endpoints that must never trigger a refresh-and-retry loop.
const NO_RETRY = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

let refreshPromise = null;

/** Refreshes the token pair, coalescing concurrent callers into one request. */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then((res) => {
        const { accessToken: token, user } = res.data.data;
        setAccessToken(token);
        return { token, user };
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const url = config?.url || '';

    const canRetry =
      response?.status === 401 &&
      config &&
      !config.__isRetry &&
      !NO_RETRY.some((p) => url.includes(p));

    if (canRetry) {
      try {
        await refreshSession();
        return api({ ...config, __isRetry: true });
      } catch {
        setAccessToken(null);
        onSessionLost();
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);

/* ── Error normalisation ───────────────────────────────────────────────────── */

/**
 * Turns any axios failure into a predictable shape so screens never have to dig
 * through `error.response.data`, and never show a blank state (rules.md § 4).
 */
export function normalizeApiError(error) {
  const payload = error?.response?.data?.error;
  const status = error?.response?.status ?? 0;

  const fieldErrors = {};
  (payload?.details || []).forEach((detail) => {
    // Only keep the first message per field — that's what forms display.
    const field = detail.field?.replace(/^body\./, '');
    if (field && !fieldErrors[field]) fieldErrors[field] = detail.message;
  });

  const message =
    payload?.message ||
    (status === 0
      ? "We couldn't reach the server. Check your connection and try again."
      : 'Something went wrong. Please try again.');

  const normalized = new Error(message);
  normalized.name = 'ApiError';
  normalized.status = status;
  normalized.code = payload?.code;
  normalized.fieldErrors = fieldErrors;
  normalized.isNetworkError = status === 0;
  return normalized;
}

/** Unwraps the `{ success, data, error }` envelope. */
export const unwrap = (response) => response.data.data;

/** Unwraps a paginated list into `{ items, meta }`. */
export const unwrapList = (response) => ({
  items: response.data.data || [],
  meta: response.data.meta || null,
});

export default api;
