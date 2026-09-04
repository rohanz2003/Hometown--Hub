/**
 * services/userService.js — profile, UI preferences, notifications, reports.
 */
import api, { unwrap, unwrapList } from './api';

export const getProfile = () => api.get('/users/me').then(unwrap);

export const updateProfile = (payload) => api.patch('/users/me', payload).then(unwrap);

/** design.md § 4 — preferences are stored server-side so they follow the user. */
export const updatePreferences = (payload) =>
  api.patch('/users/me/preferences', payload).then(unwrap);

export const getPublicProfile = (userId) => api.get(`/users/${userId}`).then(unwrap);

export const deactivateAccount = () => api.post('/users/me/deactivate').then(unwrap);

export const reportContent = (payload) => api.post('/users/reports', payload).then(unwrap);

/* ── Notifications ─────────────────────────────────────────────────────────── */

export const listNotifications = (params) =>
  api.get('/notifications', { params }).then((res) => ({
    ...unwrapList(res),
    unreadCount: res.data.meta?.unreadCount ?? 0,
  }));

export const unreadCount = () => api.get('/notifications/unread-count').then(unwrap);

export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`).then(unwrap);

export const markAllNotificationsRead = () => api.patch('/notifications/read-all').then(unwrap);

export const dismissNotification = (id) => api.delete(`/notifications/${id}`).then(unwrap);
