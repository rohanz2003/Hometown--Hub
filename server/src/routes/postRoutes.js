/**
 * routes/postRoutes.js — `/api/v1/posts`
 *
 * Post detail, edits, likes, shares, pinning, moderation, and nested comments.
 * Creating a post is community-scoped and lives in `communityRoutes.js`.
 */
const express = require('express');
const controller = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const validate = require('../middleware/validate');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimit');
const { singleImage } = require('../middleware/upload');
const {
  loadPost,
  loadComment,
  requireReadAccess,
  requireWriteAccess,
} = require('../middleware/resourceAccess');
const schemas = require('../validation/postSchemas');
const { COMMUNITY_ROLES } = require('../utils/constants');

const router = express.Router();

const asMember = requireWriteAccess(COMMUNITY_ROLES.MEMBER);
const asModerator = requireWriteAccess(COMMUNITY_ROLES.MODERATOR);

/** Personal feed across every community the user has joined. */
router.get('/feed', authenticate, validate({ query: schemas.listPostsSchema }), controller.feed);

/* ── Single post ───────────────────────────────────────────────────────────── */

router.get(
  '/:postId',
  optionalAuth,
  validate({ params: schemas.postParamsSchema }),
  loadPost,
  requireReadAccess,
  controller.detail,
);
router.patch(
  '/:postId',
  authenticate,
  singleImage('image'),
  validate({ params: schemas.postParamsSchema, body: schemas.updatePostSchema }),
  loadPost,
  asMember,
  controller.update,
);
router.delete(
  '/:postId',
  authenticate,
  validate({ params: schemas.postParamsSchema }),
  loadPost,
  asMember,
  controller.remove,
);

/* ── Engagement ────────────────────────────────────────────────────────────── */

router.post(
  '/:postId/like',
  authenticate,
  writeLimiter,
  validate({ params: schemas.postParamsSchema }),
  loadPost,
  asMember,
  controller.toggleLike,
);
router.post(
  '/:postId/share',
  authenticate,
  writeLimiter,
  validate({ params: schemas.postParamsSchema }),
  loadPost,
  requireReadAccess,
  controller.share,
);

/* ── Moderation ────────────────────────────────────────────────────────────── */

router.patch(
  '/:postId/pin',
  authenticate,
  validate({ params: schemas.postParamsSchema, body: schemas.pinSchema }),
  loadPost,
  asModerator,
  controller.setPinned,
);
router.patch(
  '/:postId/moderate',
  authenticate,
  validate({ params: schemas.postParamsSchema, body: schemas.moderatePostSchema }),
  loadPost,
  asModerator,
  controller.moderate,
);

/* ── Comments ──────────────────────────────────────────────────────────────── */

router.get(
  '/:postId/comments',
  optionalAuth,
  validate({ params: schemas.postParamsSchema }),
  loadPost,
  requireReadAccess,
  commentController.list,
);
router.post(
  '/:postId/comments',
  authenticate,
  writeLimiter,
  validate({ params: schemas.postParamsSchema, body: schemas.createCommentSchema }),
  loadPost,
  asMember,
  commentController.create,
);

/* ── Single comment (addressed directly) ───────────────────────────────────── */

const commentRouter = express.Router();

commentRouter.patch(
  '/:commentId',
  authenticate,
  validate({ params: schemas.commentParamsSchema, body: schemas.updateCommentSchema }),
  loadComment,
  asMember,
  commentController.update,
);
commentRouter.delete(
  '/:commentId',
  authenticate,
  validate({ params: schemas.commentParamsSchema }),
  loadComment,
  asMember,
  commentController.remove,
);
commentRouter.post(
  '/:commentId/like',
  authenticate,
  writeLimiter,
  validate({ params: schemas.commentParamsSchema }),
  loadComment,
  asMember,
  commentController.toggleLike,
);
commentRouter.patch(
  '/:commentId/moderate',
  authenticate,
  validate({ params: schemas.commentParamsSchema, body: schemas.moderatePostSchema }),
  loadComment,
  asModerator,
  commentController.moderate,
);

module.exports = { postRouter: router, commentRouter };
