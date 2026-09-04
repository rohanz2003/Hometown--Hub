/**
 * routes/communityRoutes.js — `/api/v1/communities`
 *
 * Phase 3 community CRUD plus the Phase 4 moderator tools. Nested `/posts` and
 * `/events` collections live here because both are always scoped to a community.
 */
const express = require('express');
const controller = require('../controllers/communityController');
const postController = require('../controllers/postController');
const eventController = require('../controllers/eventController');
const validate = require('../middleware/validate');
const { authenticate, optionalAuth, requirePlatformAdmin } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimit');
const { singleImage } = require('../middleware/upload');
const {
  loadCommunity,
  loadMembership,
  requireCommunityRole,
  requireCommunityRead,
} = require('../middleware/communityAccess');
const schemas = require('../validation/communitySchemas');
const postSchemas = require('../validation/postSchemas');
const eventSchemas = require('../validation/eventSchemas');
const { COMMUNITY_ROLES } = require('../utils/constants');

const router = express.Router();

/** Resolve the community and the caller's membership for every nested route. */
const withCommunity = [loadCommunity, loadMembership];
const readable = [...withCommunity, requireCommunityRead];
const asMember = [...withCommunity, requireCommunityRole(COMMUNITY_ROLES.MEMBER)];
const asModerator = [...withCommunity, requireCommunityRole(COMMUNITY_ROLES.MODERATOR)];
const asAdmin = [...withCommunity, requireCommunityRole(COMMUNITY_ROLES.ADMIN)];

/* ── Directory ─────────────────────────────────────────────────────────────── */

router.get('/', optionalAuth, validate({ query: schemas.listCommunitiesSchema }), controller.list);
router.get('/mine', authenticate, controller.mine);
router.post(
  '/',
  authenticate,
  writeLimiter,
  validate({ body: schemas.createCommunitySchema }),
  controller.create,
);

/* ── Single community ──────────────────────────────────────────────────────── */

router.get(
  '/:communityId',
  optionalAuth,
  validate({ params: schemas.communityParamsSchema }),
  ...readable,
  controller.detail,
);
router.patch(
  '/:communityId',
  authenticate,
  validate({ params: schemas.communityParamsSchema, body: schemas.updateCommunitySchema }),
  ...asAdmin,
  controller.update,
);
router.delete(
  '/:communityId',
  authenticate,
  requirePlatformAdmin,
  validate({ params: schemas.communityParamsSchema }),
  loadCommunity,
  controller.remove,
);

/* ── Membership ────────────────────────────────────────────────────────────── */

router.post(
  '/:communityId/join',
  authenticate,
  writeLimiter,
  validate({ params: schemas.communityParamsSchema, body: schemas.joinSchema }),
  loadCommunity,
  controller.join,
);
router.delete(
  '/:communityId/leave',
  authenticate,
  validate({ params: schemas.communityParamsSchema }),
  loadCommunity,
  controller.leave,
);
router.get(
  '/:communityId/members',
  authenticate,
  validate({ params: schemas.communityParamsSchema, query: schemas.listMembersSchema }),
  ...asMember,
  controller.members,
);
router.patch(
  '/:communityId/members/:membershipId/review',
  authenticate,
  validate({ params: schemas.memberParamsSchema, body: schemas.reviewMemberSchema }),
  ...asModerator,
  controller.reviewMember,
);
router.patch(
  '/:communityId/members/:membershipId/role',
  authenticate,
  validate({ params: schemas.memberParamsSchema, body: schemas.setRoleSchema }),
  ...asAdmin,
  controller.setMemberRole,
);
router.delete(
  '/:communityId/members/:membershipId',
  authenticate,
  validate({ params: schemas.memberParamsSchema, body: schemas.removeMemberSchema }),
  ...asModerator,
  controller.removeMember,
);

/* ── Nested posts ──────────────────────────────────────────────────────────── */

router.get(
  '/:communityId/posts',
  optionalAuth,
  validate({ params: schemas.communityParamsSchema, query: postSchemas.listPostsSchema }),
  ...readable,
  postController.listByCommunity,
);
router.post(
  '/:communityId/posts',
  authenticate,
  writeLimiter,
  singleImage('image'),
  validate({ params: schemas.communityParamsSchema, body: postSchemas.createPostSchema }),
  ...asMember,
  postController.create,
);

/* ── Nested events ─────────────────────────────────────────────────────────── */

router.get(
  '/:communityId/events',
  optionalAuth,
  validate({ params: schemas.communityParamsSchema, query: eventSchemas.listEventsSchema }),
  ...readable,
  eventController.listByCommunity,
);
router.post(
  '/:communityId/events',
  authenticate,
  writeLimiter,
  singleImage('image'),
  validate({ params: schemas.communityParamsSchema, body: eventSchemas.createEventSchema }),
  ...asMember,
  eventController.create,
);

module.exports = router;
