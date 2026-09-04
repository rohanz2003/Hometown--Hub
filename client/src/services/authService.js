/**
 * services/authService.js — auth endpoints (Phase 1).
 */
import api, { unwrap, setAccessToken } from './api';

/** Stores the returned access token and hands back the user. */
function adoptSession(response) {
  const { user, accessToken } = unwrap(response);
  setAccessToken(accessToken);
  return user;
}

export const register = (payload) => api.post('/auth/register', payload).then(adoptSession);

export const login = (credentials) => api.post('/auth/login', credentials).then(adoptSession);

/** Called on app boot: exchanges the refresh cookie for a fresh session. */
export const restoreSession = () => api.post('/auth/refresh').then(adoptSession);

export const logout = () => api.post('/auth/logout').finally(() => setAccessToken(null));

export const logoutEverywhere = () =>
  api.post('/auth/logout-all').finally(() => setAccessToken(null));

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then(unwrap);

export const resetPassword = (payload) =>
  api.post('/auth/reset-password', payload).then(adoptSession);

export const changePassword = (payload) =>
  api.post('/auth/change-password', payload).then(adoptSession);

export const me = () => api.get('/auth/me').then((res) => unwrap(res).user);
