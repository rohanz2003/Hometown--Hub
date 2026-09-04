/**
 * controllers/commentController.js — comment endpoints.
 */
const commentService = require('../services/commentService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await commentService.listByPost({
    postId: req.params.postId,
    query: req.query,
    userId: req.user?._id,
  });
  return sendSuccess(res, items, { meta });
});

const create = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment({
    post: req.post,
    author: req.user,
    body: req.body.body,
    parent: req.body.parent || null,
  });
  return sendSuccess(res, comment, { status: 201 });
});

const update = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await commentService.updateComment({
      comment: req.comment,
      body: req.body.body,
      user: req.user,
    }),
  ),
);

const remove = asyncHandler(async (req, res) => {
  await commentService.deleteComment({
    comment: req.comment,
    user: req.user,
    canModerate: req.canModerate,
  });
  return sendSuccess(res, { message: 'Comment deleted' });
});

const toggleLike = asyncHandler(async (req, res) =>
  sendSuccess(res, await commentService.toggleLike({ comment: req.comment, user: req.user })),
);

const moderate = asyncHandler(async (req, res) => {
  const comment = await commentService.moderateComment({
    comment: req.comment,
    status: req.body.status,
    reason: req.body.reason,
    user: req.user,
  });
  return sendSuccess(res, { status: comment.status });
});

module.exports = { list, create, update, remove, toggleLike, moderate };
