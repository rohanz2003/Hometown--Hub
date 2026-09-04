/**
 * validation/postSchemas.js — post and comment request schemas.
 */
const { z } = require('zod');
const { objectId, idOrSlug, tags, pagination, sort, text } = require('./common');
const { POST_STATUS, POST_TYPES } = require('../utils/constants');

const createPostSchema = z.object({
  title: z.string().trim().max(160).optional().default(''),
  body: text(1, 5000, 'Post content'),
  type: z.enum(Object.values(POST_TYPES)).optional().default(POST_TYPES.DISCUSSION),
  category: objectId.optional().nullable(),
  tags,
  imageUrl: z.string().trim().max(500).optional().default(''),
  imageAlt: z.string().trim().max(160).optional().default(''),
});

const updatePostSchema = createPostSchema.partial();

const listPostsSchema = pagination.extend({
  q: z.string().trim().max(120).optional(),
  type: z.enum(Object.values(POST_TYPES)).optional(),
  category: objectId.optional(),
  tag: z.string().trim().max(30).optional(),
  community: objectId.optional(),
  sort,
});

const postParamsSchema = z.object({ postId: objectId });
const communityPostParamsSchema = z.object({ communityId: idOrSlug });

const pinSchema = z.object({ pinned: z.coerce.boolean() });

const moderatePostSchema = z.object({
  status: z.enum(Object.values(POST_STATUS)),
  reason: z.string().trim().max(300).optional().default(''),
});

const createCommentSchema = z.object({
  body: text(1, 2000, 'Comment'),
  parent: objectId.optional().nullable(),
});

const updateCommentSchema = z.object({ body: text(1, 2000, 'Comment') });

const commentParamsSchema = z.object({ commentId: objectId });

module.exports = {
  createPostSchema,
  updatePostSchema,
  listPostsSchema,
  postParamsSchema,
  communityPostParamsSchema,
  pinSchema,
  moderatePostSchema,
  createCommentSchema,
  updateCommentSchema,
  commentParamsSchema,
};
