/**
 * services/eventService.js — events and RSVPs.
 */
import api, { unwrap, unwrapList } from './api';

export const listEvents = (params) => api.get('/events', { params }).then(unwrapList);

export const listByCommunity = (communityId, params) =>
  api.get(`/communities/${communityId}/events`, { params }).then(unwrapList);

export const createEvent = (communityId, payload) =>
  api.post(`/communities/${communityId}/events`, payload).then(unwrap);

export const getEvent = (eventId) => api.get(`/events/${eventId}`).then(unwrap);

export const updateEvent = (eventId, payload) =>
  api.patch(`/events/${eventId}`, payload).then(unwrap);

export const cancelEvent = (eventId, reason = '') =>
  api.post(`/events/${eventId}/cancel`, { reason }).then(unwrap);

export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`).then(unwrap);

export const rsvp = (eventId, status) =>
  api.post(`/events/${eventId}/rsvp`, { status }).then(unwrap);

export const withdrawRsvp = (eventId) => api.delete(`/events/${eventId}/rsvp`).then(unwrap);
