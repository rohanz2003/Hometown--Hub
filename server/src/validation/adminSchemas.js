/**
 * validation/adminSchemas.js — platform-admin request schemas (Phase 4).
 */
const { z } = require('zod');
const { objectId, pagination, text } = require('./common');
const { COMMUNITY_STATUS, PLATFORM_ROLES, REPORT_STATUS } = require('../utils/constants');

const reviewCommunitySchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'reinstate']),
  note: z.string().trim().max(400).optional().default(''),
});

const listCommunitiesAdminSchema = pagination.extend({
  status: z.enum(Object.values(COMMUNITY_STATUS)).optional(),
  q: z.string().trim().max(120).optional(),
});

const listUsersSchema = pagination.extend({
  q: z.string().trim().max(120).optional(),
  role: z.enum(Object.values(PLATFORM_ROLES)).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

const setUserRoleSchema = z.object({ role: z.enum(Object.values(PLATFORM_ROLES)) });

const setUserActiveSchema = z.object({
  isActive: z.coerce.boolean(),
  reason: z.string().trim().max(300).optional().default(''),
});

const listReportsSchema = pagination.extend({
  status: z.enum(Object.values(REPORT_STATUS)).optional(),
  targetType: z.enum(['post', 'comment', 'user']).optional(),
});

const resolveReportSchema = z.object({
  status: z.enum([REPORT_STATUS.RESOLVED, REPORT_STATUS.DISMISSED]),
  resolutionNote: z.string().trim().max(400).optional().default(''),
});

const categorySchema = z.object({
  name: text(2, 60, 'Category name'),
  description: z.string().trim().max(300).optional().default(''),
  appliesTo: z
    .array(z.enum(['post', 'event']))
    .min(1)
    .optional()
    .default(['post', 'event']),
  isActive: z.coerce.boolean().optional().default(true),
});

const updateCategorySchema = categorySchema.partial();

const idParamsSchema = z.object({ id: objectId });

module.exports = {
  reviewCommunitySchema,
  listCommunitiesAdminSchema,
  listUsersSchema,
  setUserRoleSchema,
  setUserActiveSchema,
  listReportsSchema,
  resolveReportSchema,
  categorySchema,
  updateCategorySchema,
  idParamsSchema,
};
