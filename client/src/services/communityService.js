/**
 * services/communityService.js — community and membership endpoints.
 */
import api, { unwrap, unwrapList } from './api';

export const listCommunities = (params) => api.get('/communities', { params }).then(unwrapList);

export const myCommunities = () => api.get('/communities/mine').then(unwrap);

export const createCommunity = (payload) => api.post('/communities', payload).then(unwrap);

export const getCommunity = (idOrSlug) => api.get(`/communities/${idOrSlug}`).then(unwrap);

export const updateCommunity = (idOrSlug, payload) =>
  api.patch(`/communities/${idOrSlug}`, payload).then(unwrap);

export const joinCommunity = (idOrSlug, joinMessage = '') =>
  api.post(`/communities/${idOrSlug}/join`, { joinMessage }).then(unwrap);

export const leaveCommunity = (idOrSlug) =>
  api.delete(`/communities/${idOrSlug}/leave`).then(unwrap);

export const listMembers = (idOrSlug, params) =>
  api.get(`/communities/${idOrSlug}/members`, { params }).then(unwrapList);

export const reviewMember = (idOrSlug, membershipId, action) =>
  api.patch(`/communities/${idOrSlug}/members/${membershipId}/review`, { action }).then(unwrap);

export const setMemberRole = (idOrSlug, membershipId, role) =>
  api.patch(`/communities/${idOrSlug}/members/${membershipId}/role`, { role }).then(unwrap);

export const removeMember = (idOrSlug, membershipId, ban = false) =>
  api.delete(`/communities/${idOrSlug}/members/${membershipId}`, { data: { ban } }).then(unwrap);
