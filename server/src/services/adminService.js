/**
 * services/adminService.js — platform-admin operations (Phase 4).
 *
 * Approving communities, managing users and moderators, monitoring activity, and
 * maintaining the shared category list.
 */
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Event = require('../models/Event');
const Report = require('../models/Report');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPageMeta } = require('../utils/pagination');
const { notify } = require('./notificationService');
const { escapeRegex } = require('./communityService');
const {
  COMMUNITY_STATUS,
  MEMBERSHIP_STATUS,
  NOTIFICATION_TYPES,
  PLATFORM_ROLES,
  POST_STATUS,
  REPORT_STATUS,
} = require('../utils/constants');

/** Headline numbers for the admin dashboard. */
async function getPlatformStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    users,
    activeUsers,
    newUsers,
    communities,
    pendingCommunities,
    posts,
    comments,
    events,
    openReports,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ lastLoginAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Community.countDocuments({ status: COMMUNITY_STATUS.APPROVED }),
    Community.countDocuments({ status: COMMUNITY_STATUS.PENDING }),
    Post.countDocuments({ status: POST_STATUS.PUBLISHED }),
    Comment.countDocuments({ status: POST_STATUS.PUBLISHED }),
    Event.countDocuments({}),
    Report.countDocuments({ status: REPORT_STATUS.OPEN }),
  ]);

  return {
    users,
    activeUsers,
    newUsers,
    communities,
    pendingCommunities,
    posts,
    comments,
    events,
    openReports,
    // KPI from PROMPT.md § 11 — engagement per post.
    engagementRate: posts > 0 ? Number((comments / posts).toFixed(2)) : 0,
  };
}

/** Community list across every status — the approval queue lives here. */
async function listCommunities({ query = {} }) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: rx }, { 'location.city': rx }];
  }

  const [items, total] = await Promise.all([
    Community.find(filter)
      .sort({ status: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('reviewedBy', 'name')
      .lean(),
    Community.countDocuments(filter),
  ]);

  return { items, meta: buildPageMeta({ page, limit, total }) };
}

const REVIEW_TRANSITIONS = {
  approve: COMMUNITY_STATUS.APPROVED,
  reject: COMMUNITY_STATUS.REJECTED,
  suspend: COMMUNITY_STATUS.SUSPENDED,
  reinstate: COMMUNITY_STATUS.APPROVED,
};

/** Approves, rejects, suspends, or reinstates a community. */
async function reviewCommunity({ communityId, action, note = '', reviewer }) {
  const community = await Community.findById(communityId);
  if (!community) throw ApiError.notFound('That community does not exist');

  const nextStatus = REVIEW_TRANSITIONS[action];
  if (community.status === nextStatus) {
    throw ApiError.badRequest(`This community is already ${nextStatus}`);
  }

  community.status = nextStatus;
  community.reviewedBy = reviewer._id;
  community.reviewedAt = new Date();
  community.reviewNote = note;
  await community.save();

  const approved = nextStatus === COMMUNITY_STATUS.APPROVED;
  await notify({
    recipient: community.createdBy,
    actor: reviewer._id,
    community: community._id,
    type: approved ? NOTIFICATION_TYPES.COMMUNITY_APPROVED : NOTIFICATION_TYPES.COMMUNITY_REJECTED,
    message: approved
      ? `${community.name} is now live — invite your neighbours!`
      : `${community.name} was ${nextStatus}${note ? `: ${note}` : ''}`,
    link: `/communities/${community.slug}`,
  });

  return community;
}

async function listUsers({ query = {} }) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { 'hometown.city': rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Community counts make the moderator overview useful at a glance.
  const counts = await Membership.aggregate([
    { $match: { user: { $in: items.map((u) => u._id) }, status: MEMBERSHIP_STATUS.APPROVED } },
    { $group: { _id: '$user', communities: { $sum: 1 } } },
  ]);
  const countByUser = new Map(counts.map((c) => [String(c._id), c.communities]));

  return {
    items: items.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      hometown: u.hometown,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      communityCount: countByUser.get(String(u._id)) || 0,
    })),
    meta: buildPageMeta({ page, limit, total }),
  };
}

/** Grants or revokes the platform-admin role. */
async function setUserRole({ userId, role, actor }) {
  if (String(userId) === String(actor._id)) {
    throw ApiError.badRequest('You cannot change your own role');
  }
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('That account does not exist');

  if (user.role === PLATFORM_ROLES.PLATFORM_ADMIN && role !== PLATFORM_ROLES.PLATFORM_ADMIN) {
    const admins = await User.countDocuments({ role: PLATFORM_ROLES.PLATFORM_ADMIN });
    if (admins <= 1) throw ApiError.badRequest('The last platform admin cannot be demoted');
  }

  user.role = role;
  // Force a re-login so the new role is reflected in freshly-minted tokens.
  user.tokenVersion += 1;
  await user.save();
  return user.toPublicJSON();
}

/** Deactivates or restores an account; deactivation also ends its sessions. */
async function setUserActive({ userId, isActive, actor }) {
  if (String(userId) === String(actor._id)) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('That account does not exist');

  user.isActive = isActive;
  if (!isActive) user.tokenVersion += 1;
  await user.save();
  return user.toPublicJSON();
}

/* ── Content categories & tags ─────────────────────────────────────────────── */

async function listCategories({ includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true };
  return Category.find(filter).sort({ name: 1 }).lean();
}

async function createCategory({ data, actor }) {
  const slug = Category.toSlug(data.name);
  if (await Category.exists({ slug })) throw ApiError.conflict('That category already exists');
  return Category.create({ ...data, slug, createdBy: actor._id });
}

async function updateCategory({ categoryId, data }) {
  const category = await Category.findById(categoryId);
  if (!category) throw ApiError.notFound('That category does not exist');

  if (data.name && data.name !== category.name) {
    const slug = Category.toSlug(data.name);
    if (await Category.exists({ slug, _id: { $ne: category._id } })) {
      throw ApiError.conflict('That category already exists');
    }
    category.slug = slug;
  }
  Object.assign(category, data);
  await category.save();
  return category;
}

/** Categories are deactivated rather than deleted so existing posts keep theirs. */
async function deactivateCategory({ categoryId }) {
  const category = await Category.findById(categoryId);
  if (!category) throw ApiError.notFound('That category does not exist');
  category.isActive = false;
  await category.save();
  return category;
}

module.exports = {
  getPlatformStats,
  listCommunities,
  reviewCommunity,
  listUsers,
  setUserRole,
  setUserActive,
  listCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
};
