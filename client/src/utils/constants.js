/**
 * utils/constants.js — labels and option lists shared across the UI.
 *
 * Values mirror `server/src/utils/constants.js`; only the display strings live here.
 */

export const POST_TYPES = [
  { value: 'discussion', label: 'Discussion', hint: 'A question or general chat' },
  { value: 'announcement', label: 'Announcement', hint: 'Notifies the whole community' },
  { value: 'news', label: 'Local news', hint: 'Something happening nearby' },
  { value: 'alert', label: 'Alert', hint: 'Urgent — notifies everyone' },
  { value: 'culture', label: 'Culture & traditions', hint: 'Festivals, history, memories' },
  { value: 'help', label: 'Help needed', hint: 'Ask neighbours for a hand' },
];

export const POST_TYPE_LABELS = Object.fromEntries(POST_TYPES.map((t) => [t.value, t.label]));

/** Post types that carry a visual emphasis in the feed. */
export const POST_TYPE_TONE = {
  announcement: 'primary',
  alert: 'error',
  culture: 'secondary',
  help: 'accent',
  news: 'muted',
  discussion: 'muted',
};

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'popular', label: 'Most popular' },
  { value: 'oldest', label: 'Oldest first' },
];

export const RSVP_OPTIONS = [
  { value: 'going', label: 'Going' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_going', label: "Can't make it" },
];

export const RSVP_LABELS = Object.fromEntries(RSVP_OPTIONS.map((o) => [o.value, o.label]));

export const COMMUNITY_ROLE_LABELS = {
  member: 'Member',
  moderator: 'Moderator',
  admin: 'Community admin',
};

export const MEMBERSHIP_STATUS_LABELS = {
  pending: 'Awaiting approval',
  approved: 'Member',
  rejected: 'Not approved',
  banned: 'Removed',
};

export const COMMUNITY_STATUS_LABELS = {
  pending: 'Awaiting review',
  approved: 'Live',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

export const NOTIFICATION_ICONS = {
  post_comment: '💬',
  post_like: '❤️',
  member_request: '🙋',
  member_approved: '✅',
  member_rejected: '🚫',
  community_approved: '🎉',
  community_rejected: '📋',
  announcement_pinned: '📌',
  event_created: '📅',
  event_reminder: '⏰',
  event_cancelled: '❌',
  content_removed: '🗑️',
  report_resolved: '🛡️',
};

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Match my device' },
];

export const PAGE_SIZE = 10;
