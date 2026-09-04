/**
 * services/dashboardService.js — Phase 2 dashboard summary and shared lookups.
 */
import api, { unwrap } from './api';

export const getSummary = () => api.get('/dashboard/summary').then(unwrap);

/** Active categories, used by post/event filters and forms. */
export const listCategories = () => api.get('/categories').then(unwrap);
