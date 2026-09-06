/**
 * utils/constants.js — shared enums used by models, middleware, and validation.
 *
 * Keep this the single source of truth so a role or status string is never
 * spelled differently in two places.
 */

/** Platform-wide role, stored on the user document. */
const PLATFORM_ROLES = {
  USER: 'user',
  PLATFORM_ADMIN: 'platform_admin',
};

/** Role inside one community, stored on the membership document. */
const COMMUNITY_ROLES = {
  MEMBER: 'member',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
};

/** Ordered from least to most privileged — used for `hasAtLeast` checks. */
const COMMUNITY_ROLE_RANK = {
  [COMMUNITY_ROLES.MEMBER]: 1,
  [COMMUNITY_ROLES.MODERATOR]: 2,
  [COMMUNITY_ROLES.ADMIN]: 3,
};

const MEMBERSHIP_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  BANNED: 'banned',
};

/** New communities need platform-admin approval before they go live. */
const COMMUNITY_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

const COMMUNITY_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
};

const POST_STATUS = {
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
  REMOVED: 'removed',
};

const POST_TYPES = {
  DISCUSSION: 'discussion',
  ANNOUNCEMENT: 'announcement',
  NEWS: 'news',
  ALERT: 'alert',
  CULTURE: 'culture',
  HELP: 'help',
};

const EVENT_STATUS = {
  SCHEDULED: 'scheduled',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

const RSVP_STATUS = {
  GOING: 'going',
  INTERESTED: 'interested',
  NOT_GOING: 'not_going',
};

const NOTIFICATION_TYPES = {
  POST_COMMENT: 'post_comment',
  POST_LIKE: 'post_like',
  MEMBER_REQUEST: 'member_request',
  MEMBER_APPROVED: 'member_approved',
  MEMBER_REJECTED: 'member_rejected',
  COMMUNITY_SUBMITTED: 'community_submitted',
  COMMUNITY_APPROVED: 'community_approved',
  COMMUNITY_REJECTED: 'community_rejected',
  ANNOUNCEMENT_PINNED: 'announcement_pinned',
  EVENT_CREATED: 'event_created',
  EVENT_REMINDER: 'event_reminder',
  EVENT_CANCELLED: 'event_cancelled',
  CONTENT_REMOVED: 'content_removed',
  REPORT_RESOLVED: 'report_resolved',
};

const REPORT_TARGETS = { POST: 'post', COMMENT: 'comment', USER: 'user' };
const REPORT_STATUS = { OPEN: 'open', RESOLVED: 'resolved', DISMISSED: 'dismissed' };

const SORT_OPTIONS = { RECENT: 'recent', POPULAR: 'popular', OLDEST: 'oldest' };

module.exports = {
  PLATFORM_ROLES,
  COMMUNITY_ROLES,
  COMMUNITY_ROLE_RANK,
  MEMBERSHIP_STATUS,
  COMMUNITY_STATUS,
  COMMUNITY_VISIBILITY,
  POST_STATUS,
  POST_TYPES,
  EVENT_STATUS,
  RSVP_STATUS,
  NOTIFICATION_TYPES,
  REPORT_TARGETS,
  REPORT_STATUS,
  SORT_OPTIONS,
};
