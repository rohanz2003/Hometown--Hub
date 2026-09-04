/**
 * middleware/communityAccess.js — community-scoped authorization.
 *
 * Loads the community once per request and derives the caller's effective role
 * inside it, so controllers never re-query memberships. Platform admins are
 * treated as community admins everywhere (phases.doc.md Phase 4).
 */
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  COMMUNITY_ROLES,
  COMMUNITY_ROLE_RANK,
  COMMUNITY_STATUS,
  MEMBERSHIP_STATUS,
  PLATFORM_ROLES,
} = require('../utils/constants');

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

/** Resolves `:communityId` (id or slug) into `req.community`. */
const loadCommunity = asyncHandler(async (req, res, next) => {
  const key = req.params.communityId || req.params.id || req.params.slug;
  if (!key) throw ApiError.badRequest('A community is required');

  const community = isObjectId(key)
    ? await Community.findById(key)
    : await Community.findOne({ slug: String(key).toLowerCase() });

  if (!community) throw ApiError.notFound('That community does not exist');
  req.community = community;
  next();
});

/** Loads the caller's membership (if any) into `req.membership`. */
const loadMembership = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.community) return next();
  req.membership = await Membership.findOne({ user: req.user._id, community: req.community._id });
  return next();
});

/** Effective community role, accounting for the platform-admin override. */
function effectiveRole(req) {
  if (req.user && req.user.role === PLATFORM_ROLES.PLATFORM_ADMIN) return COMMUNITY_ROLES.ADMIN;
  if (req.membership && req.membership.status === MEMBERSHIP_STATUS.APPROVED) {
    return req.membership.role;
  }
  return null;
}

/**
 * Requires an approved membership of at least `minRole`.
 * Must run after `loadCommunity` + `loadMembership`.
 */
function requireCommunityRole(minRole = COMMUNITY_ROLES.MEMBER) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());

    const isPlatformAdmin = req.user.role === PLATFORM_ROLES.PLATFORM_ADMIN;
    if (!isPlatformAdmin && req.community.status !== COMMUNITY_STATUS.APPROVED) {
      return next(ApiError.forbidden('This community is not active yet'));
    }
    if (req.membership && req.membership.status === MEMBERSHIP_STATUS.BANNED) {
      return next(ApiError.forbidden('You have been removed from this community'));
    }

    const role = effectiveRole(req);
    if (!role) {
      return next(ApiError.forbidden('Join this community to take part'));
    }
    if ((COMMUNITY_ROLE_RANK[role] || 0) < (COMMUNITY_ROLE_RANK[minRole] || 0)) {
      return next(ApiError.forbidden("You don't have permission to do that here"));
    }
    req.communityRole = role;
    return next();
  };
}

/** Read access: public approved communities are open; private ones need membership. */
const requireCommunityRead = (req, res, next) => {
  const isPlatformAdmin = req.user && req.user.role === PLATFORM_ROLES.PLATFORM_ADMIN;
  if (isPlatformAdmin) {
    req.communityRole = COMMUNITY_ROLES.ADMIN;
    return next();
  }
  const role = effectiveRole(req);
  if (req.community.status !== COMMUNITY_STATUS.APPROVED && !role) {
    return next(ApiError.notFound('That community does not exist'));
  }
  if (req.community.visibility === 'private' && !role) {
    return next(ApiError.forbidden('This community is private — request to join to see its posts'));
  }
  req.communityRole = role;
  return next();
};

module.exports = {
  loadCommunity,
  loadMembership,
  requireCommunityRole,
  requireCommunityRead,
  effectiveRole,
  isObjectId,
};
