/**
 * validation/userSchemas.js — profile, preferences, and notification schemas.
 */
const { z } = require('zod');
const { objectId, phone, hometown, pagination, text } = require('./common');

const updateProfileSchema = z.object({
  name: text(2, 80, 'Name').optional(),
  phone,
  bio: z.string().trim().max(400).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  hometown: hometown.partial().optional(),
});

/** design.md § 4 — UI preferences persist on the user profile, not just locally. */
const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().trim().min(2).max(10).optional(),
  sidebarCollapsed: z.coerce.boolean().optional(),
  feedView: z.enum(['list', 'grid']).optional(),
  defaultCommunity: objectId.nullable().optional(),
  emailNotifications: z.coerce.boolean().optional(),
});

const listNotificationsSchema = pagination.extend({
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

const notificationParamsSchema = z.object({ notificationId: objectId });

const userParamsSchema = z.object({ userId: objectId });

const createReportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user']),
  targetId: objectId,
  reason: text(5, 500, 'Reason'),
});

module.exports = {
  updateProfileSchema,
  updatePreferencesSchema,
  listNotificationsSchema,
  notificationParamsSchema,
  userParamsSchema,
  createReportSchema,
};
