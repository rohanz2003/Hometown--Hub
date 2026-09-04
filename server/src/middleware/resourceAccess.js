/**
 * middleware/resourceAccess.js — loads a post/comment/event plus the community
 * context needed to authorize the request.
 *
 * These routes are addressed by resource id (`/posts/:postId`) rather than by
 * community, so the community and the caller's role in it are resolved here.
 */
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Event = require('../models/Event');
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

/** Populates `req.community`, `req.membership`, `req.communityRole`, `req.canModerate`. */
async function attachCommunityContext(req, communityId) {
  req.community = await Community.findById(communityId);
  if (!req.community) throw ApiError.notFound('That community no longer exists');

  if (req.user) {
    req.membership = await Membership.findOne({ user: req.user._id, community: req.community._id });
  }

  const isPlatformAdmin = req.user && req.user.role === PLATFORM_ROLES.PLATFORM_ADMIN;
  const activeMembership =
    req.membership && req.membership.status === MEMBERSHIP_STATUS.APPROVED ? req.membership : null;

  req.communityRole = isPlatformAdmin ? COMMUNITY_ROLES.ADMIN : activeMembership?.role || null;
  req.canModerate =
    (COMMUNITY_ROLE_RANK[req.communityRole] || 0) >= COMMUNITY_ROLE_RANK[COMMUNITY_ROLES.MODERATOR];
  return req.community;
}

const loadPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) throw ApiError.notFound('That post no longer exists');
  req.post = post;
  await attachCommunityContext(req, post.community);
  next();
});

const loadComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw ApiError.notFound('That comment no longer exists');
  req.comment = comment;
  await attachCommunityContext(req, comment.community);
  next();
});

const loadEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) throw ApiError.notFound('That event no longer exists');
  req.event = event;
  await attachCommunityContext(req, event.community);
  next();
});

/** Read guard: private communities are only readable by members. */
const requireReadAccess = (req, res, next) => {
  const isPlatformAdmin = req.user && req.user.role === PLATFORM_ROLES.PLATFORM_ADMIN;
  if (isPlatformAdmin) return next();
  if (req.community.status !== COMMUNITY_STATUS.APPROVED && !req.communityRole) {
    return next(ApiError.notFound('That community no longer exists'));
  }
  if (req.community.visibility === 'private' && !req.communityRole) {
    return next(
      ApiError.forbidden('This community is private — request to join to see its content'),
    );
  }
  return next();
};

/** Write guard: an approved membership of at least `minRole` is required. */
function requireWriteAccess(minRole = COMMUNITY_ROLES.MEMBER) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.membership && req.membership.status === MEMBERSHIP_STATUS.BANNED) {
      return next(ApiError.forbidden('You have been removed from this community'));
    }
    if (!req.communityRole) return next(ApiError.forbidden('Join this community to take part'));
    if ((COMMUNITY_ROLE_RANK[req.communityRole] || 0) < (COMMUNITY_ROLE_RANK[minRole] || 0)) {
      return next(ApiError.forbidden("You don't have permission to do that here"));
    }
    return next();
  };
}

module.exports = {
  loadPost,
  loadComment,
  loadEvent,
  requireReadAccess,
  requireWriteAccess,
  attachCommunityContext,
};
