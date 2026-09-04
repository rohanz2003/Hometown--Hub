/**
 * validation/communitySchemas.js — community and membership request schemas.
 */
const { z } = require('zod');
const { objectId, idOrSlug, tags, pagination, sort, text } = require('./common');
const {
  COMMUNITY_ROLES,
  COMMUNITY_STATUS,
  COMMUNITY_VISIBILITY,
  MEMBERSHIP_STATUS,
} = require('../utils/constants');

const locationSchema = z.object({
  city: text(1, 120, 'City or village'),
  district: z.string().trim().max(120).optional().default(''),
  state: z.string().trim().max(120).optional().default(''),
  country: z.string().trim().max(120).optional().default(''),
});

const ruleSchema = z.object({
  title: text(1, 120, 'Rule title'),
  body: z.string().trim().max(600).optional().default(''),
});

const createCommunitySchema = z.object({
  name: text(3, 100, 'Community name'),
  description: z.string().trim().max(1000).optional().default(''),
  location: locationSchema,
  coverImageUrl: z.string().trim().max(500).optional().default(''),
  rules: z.array(ruleSchema).max(20).optional().default([]),
  tags,
  visibility: z
    .enum(Object.values(COMMUNITY_VISIBILITY))
    .optional()
    .default(COMMUNITY_VISIBILITY.PUBLIC),
  requiresApproval: z.coerce.boolean().optional().default(false),
});

const updateCommunitySchema = createCommunitySchema.partial();

const listCommunitiesSchema = pagination.extend({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  tag: z.string().trim().max(30).optional(),
  status: z.enum(Object.values(COMMUNITY_STATUS)).optional(),
  sort,
});

const communityParamsSchema = z.object({ communityId: idOrSlug });

const joinSchema = z.object({
  joinMessage: z.string().trim().max(300).optional().default(''),
});

const listMembersSchema = pagination.extend({
  status: z.enum(Object.values(MEMBERSHIP_STATUS)).optional(),
  role: z.enum(Object.values(COMMUNITY_ROLES)).optional(),
});

const reviewMemberSchema = z.object({ action: z.enum(['approve', 'reject']) });

const setRoleSchema = z.object({ role: z.enum(Object.values(COMMUNITY_ROLES)) });

const removeMemberSchema = z.object({ ban: z.coerce.boolean().optional().default(false) });

const memberParamsSchema = z.object({ communityId: idOrSlug, membershipId: objectId });

module.exports = {
  createCommunitySchema,
  updateCommunitySchema,
  listCommunitiesSchema,
  communityParamsSchema,
  joinSchema,
  listMembersSchema,
  reviewMemberSchema,
  setRoleSchema,
  removeMemberSchema,
  memberParamsSchema,
};
