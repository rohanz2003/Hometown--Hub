/**
 * services/adminService.js — platform-admin and moderation-queue endpoints.
 */
import api, { unwrap, unwrapList } from './api';

export const getStats = () => api.get('/admin/stats').then(unwrap);

export const listCommunities = (params) =>
  api.get('/admin/communities', { params }).then(unwrapList);

export const reviewCommunity = (id, action, note = '') =>
  api.patch(`/admin/communities/${id}/review`, { action, note }).then(unwrap);

export const listUsers = (params) => api.get('/admin/users', { params }).then(unwrapList);

export const setUserRole = (id, role) =>
  api.patch(`/admin/users/${id}/role`, { role }).then(unwrap);

export const setUserActive = (id, isActive) =>
  api.patch(`/admin/users/${id}/active`, { isActive }).then(unwrap);

export const listReports = (params) => api.get('/admin/reports', { params }).then(unwrapList);

export const resolveReport = (id, status, resolutionNote = '') =>
  api.patch(`/admin/reports/${id}`, { status, resolutionNote }).then(unwrap);

/* ── Categories ────────────────────────────────────────────────────────────── */

export const listAllCategories = () => api.get('/admin/categories').then(unwrap);

export const createCategory = (payload) => api.post('/admin/categories', payload).then(unwrap);

export const updateCategory = (id, payload) =>
  api.patch(`/admin/categories/${id}`, payload).then(unwrap);

export const deactivateCategory = (id) => api.delete(`/admin/categories/${id}`).then(unwrap);
