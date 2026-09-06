/**
 * services/communityService.js — create, browse, and edit communities.
 *
 * New communities start as `pending` and only appear in public listings once a
 * platform admin approves them (phases.doc.md Phase 3 § admin approval flow).
 */
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const { notifyPlatformAdmins } = require('./notificationService');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPageMeta } = require('../utils/pagination');
const {
  COMMUNITY_ROLES,
  COMMUNITY_STATUS,
  MEMBERSHIP_STATUS,
  NOTIFICATION_TYPES,
  SORT_OPTIONS,
} = require('../utils/constants');

/** Finds a free slug by appending `-2`, `-3`, … on collision. */
async function uniqueSlug(name) {
  const base = Community.toSlug(name) || 'community';
  let candidate = base;
  let suffix = 1;
  /* eslint-disable no-await-in-loop -- sequential by nature: each try depends on the last. */
  while (await Community.exists({ slug: candidate })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  /* eslint-enable no-await-in-loop */
  return candidate;
}

const SORTS = {
  [SORT_OPTIONS.RECENT]: { createdAt: -1 },
  [SORT_OPTIONS.POPULAR]: { memberCount: -1, createdAt: -1 },
  [SORT_OPTIONS.OLDEST]: { createdAt: 1 },
};

/**
 * Public directory of communities with search, city filter, and sorting.
 * Only approved communities are listed unless the caller is a platform admin.
 */
async function listCommunities({ query = {}, isPlatformAdmin = false, userId = null }) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  filter.status = isPlatformAdmin && query.status ? query.status : COMMUNITY_STATUS.APPROVED;
  if (query.city) filter['location.city'] = new RegExp(`^${escapeRegex(query.city)}`, 'i');
  if (query.tag) filter.tags = String(query.tag).toLowerCase();
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { 'location.city': rx }];
  }

  const [items, total] = await Promise.all([
    Community.find(filter)
      .sort(SORTS[query.sort] || SORTS[SORT_OPTIONS.RECENT])
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name avatarUrl')
      .lean(),
    Community.countDocuments(filter),
  ]);

  const decorated = await attachViewerState(items, userId);
  return { items: decorated, meta: buildPageMeta({ page, limit, total }) };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Adds `myRole` / `myStatus` so the client can render the right join button. */
async function attachViewerState(communities, userId) {
  if (!userId || communities.length === 0) {
    return communities.map((c) => ({ ...c, myRole: null, myStatus: null }));
  }
  const memberships = await Membership.find({
    user: userId,
    community: { $in: communities.map((c) => c._id) },
  })
    .select('community role status')
    .lean();

  const byCommunity = new Map(memberships.map((m) => [String(m.community), m]));
  return communities.map((c) => {
    const m = byCommunity.get(String(c._id));
    return { ...c, myRole: m ? m.role : null, myStatus: m ? m.status : null };
  });
}

/** Creates a community and makes the creator its first admin. */
async function createCommunity({ userId, data }) {
  const slug = await uniqueSlug(data.name);
  const community = await Community.create({
    ...data,
    slug,
    createdBy: userId,
    status: COMMUNITY_STATUS.PENDING,
    memberCount: 1,
  });

  await Membership.create({
    user: userId,
    community: community._id,
    role: COMMUNITY_ROLES.ADMIN,
    status: MEMBERSHIP_STATUS.APPROVED,
  });

  await notifyPlatformAdmins({
    actor: userId,
    community: community._id,
    type: NOTIFICATION_TYPES.COMMUNITY_SUBMITTED,
    message: `${community.name} is waiting for platform approval`,
    link: '/admin',
  });

  return community;
}

/** Single community with the viewer's membership state attached. */
async function getCommunity({ community, userId }) {
  const [decorated] = await attachViewerState([community.toObject()], userId);
  return decorated;
}

const EDITABLE_FIELDS = [
  'name',
  'description',
  'location',
  'coverImageUrl',
  'rules',
  'tags',
  'visibility',
  'requiresApproval',
];

async function updateCommunity({ community, data }) {
  EDITABLE_FIELDS.forEach((field) => {
    if (data[field] !== undefined) community[field] = data[field];
  });
  await community.save();
  return community;
}

/** Communities the signed-in user belongs to, newest membership first. */
async function myCommunities(userId) {
  const memberships = await Membership.find({
    user: userId,
    status: { $in: [MEMBERSHIP_STATUS.APPROVED, MEMBERSHIP_STATUS.PENDING] },
  })
    .sort({ createdAt: -1 })
    .populate('community')
    .lean();

  return memberships
    .filter((m) => m.community)
    .map((m) => ({ ...m.community, myRole: m.role, myStatus: m.status }));
}

/** Deletes a community. Platform-admin only; cascades are handled by the caller. */
async function deleteCommunity(community) {
  if (community.status === COMMUNITY_STATUS.APPROVED && community.memberCount > 1) {
    throw ApiError.badRequest('Suspend this community instead — it still has active members');
  }
  await Membership.deleteMany({ community: community._id });
  await community.deleteOne();
}

module.exports = {
  listCommunities,
  createCommunity,
  getCommunity,
  updateCommunity,
  myCommunities,
  deleteCommunity,
  attachViewerState,
  uniqueSlug,
  escapeRegex,
};
