/**
 * services/notificationService.js — creates in-app notifications.
 *
 * Every write goes through here so notification text and deep links stay
 * consistent, and so a failed notification can never fail the action that
 * triggered it.
 */
const Notification = require('../models/Notification');
const Membership = require('../models/Membership');
const User = require('../models/User');
const logger = require('../utils/logger');
const { MEMBERSHIP_STATUS, PLATFORM_ROLES } = require('../utils/constants');

/**
 * Creates one notification. Self-notifications are skipped (you don't need to be
 * told about your own like).
 */
async function notify({ recipient, actor, type, message, link = '', ...refs }) {
  try {
    if (!recipient) return null;
    if (actor && String(actor) === String(recipient)) return null;
    return await Notification.create({ recipient, actor, type, message, link, ...refs });
  } catch (err) {
    logger.error('Failed to create notification', { type, error: err.message });
    return null;
  }
}

/** Fans a notification out to every approved member of a community. */
async function notifyCommunity({
  community,
  actor,
  type,
  message,
  link = '',
  exclude = [],
  ...refs
}) {
  try {
    const excluded = new Set([...exclude, actor].filter(Boolean).map(String));
    const memberships = await Membership.find({
      community,
      status: MEMBERSHIP_STATUS.APPROVED,
    })
      .select('user')
      .lean();

    const docs = memberships
      .filter((m) => !excluded.has(String(m.user)))
      .map((m) => ({ recipient: m.user, actor, type, message, link, community, ...refs }));

    if (docs.length === 0) return 0;
    await Notification.insertMany(docs, { ordered: false });
    return docs.length;
  } catch (err) {
    logger.error('Failed to fan out community notification', { type, error: err.message });
    return 0;
  }
}

/** Notifies every moderator and admin of a community (e.g. a new join request). */
async function notifyModerators({ community, actor, type, message, link = '', ...refs }) {
  try {
    const mods = await Membership.find({
      community,
      status: MEMBERSHIP_STATUS.APPROVED,
      role: { $in: ['moderator', 'admin'] },
    })
      .select('user')
      .lean();

    const docs = mods
      .filter((m) => String(m.user) !== String(actor))
      .map((m) => ({ recipient: m.user, actor, type, message, link, community, ...refs }));

    if (docs.length === 0) return 0;
    await Notification.insertMany(docs, { ordered: false });
    return docs.length;
  } catch (err) {
    logger.error('Failed to notify moderators', { type, error: err.message });
    return 0;
  }
}

/** Notifies every platform admin about a pending platform-level action. */
async function notifyPlatformAdmins({ actor, type, message, link = '', ...refs }) {
  try {
    const admins = await User.find({
      role: PLATFORM_ROLES.PLATFORM_ADMIN,
      isActive: true,
    })
      .select('_id')
      .lean();

    const docs = admins
      .filter((admin) => String(admin._id) !== String(actor))
      .map((admin) => ({ recipient: admin._id, actor, type, message, link, ...refs }));

    if (docs.length === 0) return 0;
    await Notification.insertMany(docs, { ordered: false });
    return docs.length;
  } catch (err) {
    logger.error('Failed to notify platform admins', { type, error: err.message });
    return 0;
  }
}

module.exports = { notify, notifyCommunity, notifyModerators, notifyPlatformAdmins };
