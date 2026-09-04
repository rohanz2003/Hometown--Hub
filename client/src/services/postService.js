/**
 * services/postService.js — posts, likes, shares, comments, and moderation.
 */
import api, { unwrap, unwrapList } from './api';

export const feed = (params) => api.get('/posts/feed', { params }).then(unwrapList);

export const listByCommunity = (communityId, params) =>
  api.get(`/communities/${communityId}/posts`, { params }).then(unwrapList);

/** Sends multipart when an image file is attached, JSON otherwise. */
export function createPost(communityId, { image, ...payload }) {
  if (!image) return api.post(`/communities/${communityId}/posts`, payload).then(unwrap);

  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((v) => form.append(`${key}[]`, v));
    else form.append(key, value);
  });
  form.append('image', image);
  return api.post(`/communities/${communityId}/posts`, form).then(unwrap);
}

export const getPost = (postId) => api.get(`/posts/${postId}`).then(unwrap);

export const updatePost = (postId, payload) => api.patch(`/posts/${postId}`, payload).then(unwrap);

export const deletePost = (postId) => api.delete(`/posts/${postId}`).then(unwrap);

export const toggleLike = (postId) => api.post(`/posts/${postId}/like`).then(unwrap);

export const sharePost = (postId) => api.post(`/posts/${postId}/share`).then(unwrap);

export const setPinned = (postId, pinned) =>
  api.patch(`/posts/${postId}/pin`, { pinned }).then(unwrap);

export const moderatePost = (postId, status, reason = '') =>
  api.patch(`/posts/${postId}/moderate`, { status, reason }).then(unwrap);

/* ── Comments ──────────────────────────────────────────────────────────────── */

export const listComments = (postId, params) =>
  api.get(`/posts/${postId}/comments`, { params }).then(unwrapList);

export const addComment = (postId, body, parent = null) =>
  api.post(`/posts/${postId}/comments`, { body, parent }).then(unwrap);

export const updateComment = (commentId, body) =>
  api.patch(`/comments/${commentId}`, { body }).then(unwrap);

export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`).then(unwrap);

export const toggleCommentLike = (commentId) =>
  api.post(`/comments/${commentId}/like`).then(unwrap);
